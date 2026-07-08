// NETRUN OS — server-authoritative dice roll (Supabase Edge Function, Deno).
//
// This is THE authority for consequential rolls (initiative, attacks, skill checks).
// It uses a CSPRNG (crypto.getRandomValues), applies the LOCKED CP RED rules, logs the
// roll to `dice_roll`, and returns the result. The client only animates the number.
//
// LOCKED RULES (plan §4.3, §13.5):
//   1d10 + STAT + SKILL + mods vs DV.
//   Natural 10 -> +1d10 ONCE (no chaining). Natural 1 -> -1d10 ONCE. No toggle.
//
// SECURITY: the service_role key is a Supabase Function secret (auto-injected as
// SUPABASE_SERVICE_ROLE_KEY). It is never shipped to clients. The caller's JWT is used
// only to identify the roller.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Uniform integer in [1, 10] via rejection sampling (no modulo bias). */
function secureD10(): number {
  const buf = new Uint8Array(1);
  // Largest multiple of 10 that fits in a byte is 250; reject 250..255.
  while (true) {
    crypto.getRandomValues(buf);
    const v = buf[0];
    if (v < 250) return (v % 10) + 1;
  }
}

interface RollBody {
  stat?: number;
  skill?: number;
  mods?: number;
  dv?: number | null;
  kind?: string;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Identify the caller (roller) from their JWT, if present.
  const authHeader = req.headers.get("Authorization") ?? "";
  let rollerId: string | null = null;
  if (authHeader) {
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await userClient.auth.getUser();
    rollerId = data.user?.id ?? null;
  }

  let body: RollBody = {};
  try {
    body = (await req.json()) as RollBody;
  } catch {
    body = {};
  }

  const stat = num(body.stat);
  const skill = num(body.skill);
  const mods = num(body.mods);
  const dv = typeof body.dv === "number" ? Math.trunc(body.dv) : null;
  const kind = typeof body.kind === "string" ? body.kind : "generic";

  // --- Resolve per LOCKED CP RED rules ---
  const die = secureD10();
  let extraDie: number | null = null;
  let raw = die;
  let critical = false;
  let fumble = false;

  if (die === 10) {
    critical = true;
    extraDie = secureD10(); // added once; no chaining
    raw = die + extraDie;
  } else if (die === 1) {
    fumble = true;
    extraDie = secureD10(); // subtracted once
    raw = die - extraDie;
  }

  const modifier = stat + skill + mods;
  const total = raw + modifier;

  // --- Log authoritatively (service role bypasses RLS) ---
  const service = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: inserted, error } = await service
    .from("dice_roll")
    .insert({
      roller: rollerId,
      kind,
      die,
      extra_die: extraDie,
      modifier,
      total,
      critical,
      fumble,
      detail: { stat, skill, mods, dv },
    })
    .select("id")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const success = dv === null ? null : total >= dv;

  return new Response(
    JSON.stringify({
      die,
      extraDie,
      total,
      critical,
      fumble,
      success,
      rollId: inserted.id,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
