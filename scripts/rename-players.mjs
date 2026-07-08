// NETRUN OS — one-shot player rename (login email + display name).
// Renames the placeholder player2..5 accounts to the real characters. Idempotent:
// safe to run more than once. Passwords are unchanged.
//
// SECURITY: uses the SERVICE_ROLE key from a runtime env var. Never committed/bundled.
// Run via scripts/rename.ps1 (which prompts for the key), or manually:
//   $env:SUPABASE_URL=... ; $env:SUPABASE_SERVICE_ROLE_KEY=... ; node scripts/rename-players.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// oldEmail -> { newEmail, name }
const RENAMES = [
  { oldEmail: "player2@netrun.local", newEmail: "seph@netrun.local", name: "Seph Sugar" },
  { oldEmail: "player3@netrun.local", newEmail: "frank@netrun.local", name: "Frank Ratosheema" },
  { oldEmail: "player4@netrun.local", newEmail: "victor@netrun.local", name: "Victor Cone" },
  { oldEmail: "player5@netrun.local", newEmail: "zeusmd@netrun.local", name: "Zeus MD" },
];

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function setProfileName(userId, name) {
  const { error } = await admin
    .from("profiles")
    .update({ display_name: name })
    .eq("id", userId);
  if (error) throw error;
}

async function main() {
  console.log("Renaming players…");
  for (const r of RENAMES) {
    // Already renamed?
    const already = await findUserByEmail(r.newEmail);
    if (already) {
      await setProfileName(already.id, r.name);
      console.log(`  · ${r.newEmail} already exists → name set to "${r.name}"`);
      continue;
    }

    const old = await findUserByEmail(r.oldEmail);
    if (!old) {
      console.log(`  ! neither ${r.oldEmail} nor ${r.newEmail} found — skipping`);
      continue;
    }

    const { error } = await admin.auth.admin.updateUserById(old.id, {
      email: r.newEmail,
      email_confirm: true,
    });
    if (error) throw error;
    await setProfileName(old.id, r.name);
    console.log(`  + ${r.oldEmail} → ${r.newEmail}  ("${r.name}")`);
  }

  console.log("\nDone. Player logins now:");
  console.log("  steven@netrun.local   Steven Heartman");
  console.log("  seph@netrun.local     Seph Sugar");
  console.log("  frank@netrun.local    Frank Ratosheema");
  console.log("  victor@netrun.local   Victor Cone");
  console.log("  zeusmd@netrun.local   Zeus MD");
  console.log("  (password unchanged; GM = gm@netrun.local)");
}

main().catch((e) => {
  console.error("Rename failed:", e.message ?? e);
  process.exit(1);
});
