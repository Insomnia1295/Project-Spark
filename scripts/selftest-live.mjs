// NETRUN OS — live self-tests against the hosted project.
// Signs in as different roles and checks auth, RLS isolation, reference data, and the
// server-authoritative dice function. Prints ONLY pass/fail + counts — never tokens/keys.
//
// Usage:
//   $env:VITE_SUPABASE_URL / $env:VITE_SUPABASE_ANON_KEY set (publishable key is public),
//   optional $env:SEED_PASSWORD (default 'netrun-2076')
//   node scripts/selftest-live.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const password = process.env.SEED_PASSWORD || "netrun-2076";

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (ok) pass++;
  else fail++;
}

function client() {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(email) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return { c, user: data.user };
}

async function main() {
  console.log("=== NETRUN OS live self-tests ===\n");

  // --- Auth + role (self-test 2) ---
  let gm, steven, p2;
  try {
    gm = await signIn("gm@netrun.local");
    const { data: prof } = await gm.c.from("profiles").select("role").eq("id", gm.user.id).single();
    check("auth: GM signs in and has role 'gm'", prof?.role === "gm", `role=${prof?.role}`);
  } catch (e) {
    check("auth: GM signs in", false, e.message);
  }

  try {
    steven = await signIn("steven@netrun.local");
    const { data: prof } = await steven.c.from("profiles").select("role").eq("id", steven.user.id).single();
    check("auth: player (Steven) signs in and has role 'player'", prof?.role === "player", `role=${prof?.role}`);
  } catch (e) {
    check("auth: Steven signs in", false, e.message);
  }

  try {
    p2 = await signIn("player2@netrun.local");
  } catch (e) {
    check("auth: player2 signs in", false, e.message);
  }

  // --- RLS isolation (self-test 3) ---
  if (p2) {
    const { data } = await p2.c.from("character_sheet").select("*");
    check("RLS: player2 sees 0 sheets (owns none, cannot read others)", (data?.length ?? -1) === 0, `rows=${data?.length}`);
  }
  if (steven) {
    const { data } = await steven.c.from("character_sheet").select("name");
    const ok = (data?.length ?? 0) === 1 && (data?.[0]?.name ?? "").includes("Heartman");
    check("RLS: Steven sees exactly his own sheet", ok, `rows=${data?.length} name=${data?.[0]?.name ?? "-"}`);
  }
  if (gm) {
    const { data } = await gm.c.from("character_sheet").select("name, stat_int, hp, max_hp, humanity");
    const steve = data?.find((r) => r.name.includes("Heartman"));
    check("RLS: GM reads all sheets (>=1, incl. Steven)", (data?.length ?? 0) >= 1 && !!steve, `rows=${data?.length}`);
    if (steve) {
      const statsOk = steve.stat_int === 8 && steve.hp === 45 && steve.max_hp === 45 && steve.humanity === 42;
      check("seed: Steven's stats correct (INT8, HP45/45, HUM42)", statsOk, `INT=${steve.stat_int} HP=${steve.hp}/${steve.max_hp} HUM=${steve.humanity}`);
    }
    const { count } = await gm.c.from("profiles").select("*", { count: "exact", head: true });
    check("seed: 6 profiles exist", count === 6, `profiles=${count}`);
  }

  // --- Reference data (skill_def) ---
  if (steven) {
    const { data } = await steven.c.from("skill_def").select("name, gov_stat");
    const edu = data?.find((s) => s.name === "Education");
    const conv = data?.find((s) => s.name === "Conversation");
    const ok = (data?.length ?? 0) >= 30 && edu?.gov_stat === "INT" && conv?.gov_stat === "EMP";
    check("skill_def: seeded map present (Education->INT, Conversation->EMP)", ok, `skills=${data?.length}`);
  }

  // --- Edge Function: server-authoritative roll (self-test 5) ---
  if (steven) {
    const { data, error } = await steven.c.functions.invoke("roll", {
      body: { stat: 8, skill: 6, mods: 0, dv: 15, kind: "selftest" },
    });
    if (error) {
      check("edge fn: roll invocable", false, error.message);
    } else {
      const shapeOk =
        typeof data?.die === "number" && data.die >= 1 && data.die <= 10 &&
        typeof data?.total === "number" &&
        typeof data?.critical === "boolean" &&
        typeof data?.fumble === "boolean" &&
        typeof data?.rollId === "string";
      check("edge fn: roll returns valid structure", shapeOk, `die=${data?.die} total=${data?.total} crit=${data?.critical}`);
      // Verify it logged a row (GM can read the log).
      if (gm && data?.rollId) {
        const { data: row } = await gm.c.from("dice_roll").select("id, total").eq("id", data.rollId).single();
        check("edge fn: roll logged to dice_roll", row?.id === data.rollId, `logged id=${row?.id?.slice(0, 8)}`);
      }
    }
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Self-test crashed:", e.message ?? e);
  process.exit(1);
});
