// NETRUN OS — one-time account + character seed (run locally by the GM).
//
// Creates the 6 accounts (1 GM + 5 players), their profiles (with roles), and
// Steven "Doc" Heartman's character sheet.
//
// SECURITY: this uses the SERVICE_ROLE key, which bypasses RLS. It is read from an
// environment variable at runtime and is NEVER committed or bundled into the client.
// Run it once from your machine, then you can forget it.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."   # Settings -> API -> service_role (secret)
//   node scripts/seed-accounts.mjs
//
// Optionally override the shared default password:
//   $env:SEED_PASSWORD="something-better"

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD || "netrun-2076";

if (!url || !serviceKey) {
  console.error(
    "Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** @type {{email:string, role:'gm'|'player', name:string, steven?:boolean}[]} */
const ACCOUNTS = [
  { email: "gm@netrun.local", role: "gm", name: "Game Master" },
  { email: "steven@netrun.local", role: "player", name: "Steven Heartman", steven: true },
  { email: "player2@netrun.local", role: "player", name: "Player Two" },
  { email: "player3@netrun.local", role: "player", name: "Player Three" },
  { email: "player4@netrun.local", role: "player", name: "Player Four" },
  { email: "player5@netrun.local", role: "player", name: "Player Five" },
];

// Steven "Doc" Heartman — Medtech / Ripper-Doc Merc (plan §4.2).
const STEVEN_SHEET = {
  name: "Steven \"Doc\" Heartman",
  stat_int: 8,
  stat_ref: 6,
  stat_dex: 4,
  stat_tech: 8,
  stat_cool: 7,
  stat_will: 5,
  stat_luck: 7,
  stat_move: 3,
  stat_body: 8,
  stat_emp: 7,
  hp: 45,
  max_hp: 45,
  humanity: 42,
  reputation: 0, // tracked-but-hidden; GM sets the real value later
};

async function findUserByEmail(email) {
  // Paginate listUsers until we find the email (small user base, one page suffices).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function ensureUser(account) {
  let user = await findUserByEmail(account.email);
  if (user) {
    console.log(`  · exists: ${account.email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`  + created: ${account.email}`);
  }

  const { error: pErr } = await admin.from("profiles").upsert({
    id: user.id,
    role: account.role,
    display_name: account.name,
  });
  if (pErr) throw pErr;

  return user;
}

async function ensureStevenSheet(ownerId) {
  const { data: existing, error: selErr } = await admin
    .from("character_sheet")
    .select("id")
    .eq("owner", ownerId)
    .limit(1);
  if (selErr) throw selErr;

  if (existing && existing.length > 0) {
    const { error } = await admin
      .from("character_sheet")
      .update(STEVEN_SHEET)
      .eq("id", existing[0].id);
    if (error) throw error;
    console.log("  · updated Steven's character sheet");
  } else {
    const { error } = await admin
      .from("character_sheet")
      .insert({ ...STEVEN_SHEET, owner: ownerId });
    if (error) throw error;
    console.log("  + inserted Steven's character sheet");
  }
}

async function main() {
  console.log("Seeding NETRUN OS accounts…");
  let stevenId = null;
  for (const account of ACCOUNTS) {
    const user = await ensureUser(account);
    if (account.steven) stevenId = user.id;
  }
  if (stevenId) await ensureStevenSheet(stevenId);

  console.log("\nDone. Logins (password = SEED_PASSWORD, default 'netrun-2076'):");
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.toUpperCase().padEnd(6)} ${a.email}`);
  }
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
