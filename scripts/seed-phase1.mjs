// NETRUN OS — Phase 1 content seed (run locally by the GM, once).
//
// Seeds Steven "Doc" Heartman's portal data + the shared/global content the 7 read-only
// tabs render. Every PC value is reconciled to Docs/reference/Steven Heartman.pdf.
// Idempotent: re-running replaces the rows it manages (safe to run repeatedly).
//
// SECURITY: uses the SERVICE_ROLE key from a runtime env var (bypasses RLS). It is
// NEVER committed or bundled into the client. Run AFTER `supabase db push` applies 0003.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"
//   node scripts/seed-phase1.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STEVEN_EMAIL = process.env.STEVEN_EMAIL || "steven@netrun.local";

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserId(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const u = data.users.find((x) => x.email === email);
  return u?.id ?? null;
}

function die(msg, err) {
  console.error(`✗ ${msg}:`, err?.message ?? err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Steven's data (reconciled to the sheet)
// ---------------------------------------------------------------------------
const SHEET_PATCH = {
  handle: "Doc / Vargo Quinn",
  role_title: "Medtech",
  role_line: "MEDTECH · RIPPER-DOC MERC",
  role_ability: "Medicine",
  role_rank: 4,
  eddies: 4157,
};

// [skill_def name, specialization | null, level]
const SKILLS = [
  ["Concentration", null, 2],
  ["Perception", null, 4],
  ["Athletics", null, 2],
  ["Resist Torture/Drugs", null, 4],
  ["Stealth", null, 2],
  ["Drive Land Vehicle", null, 2],
  ["Bureaucracy", null, 3],
  ["Criminology", null, 2],
  ["Deduction", null, 2],
  ["Education", null, 6],
  ["Language", "Streetslang", 2],
  ["Language", "Native", 2],
  ["Local Expert", "Your Home", 2],
  ["Local Expert", "Corpo", 2],
  ["Tactics", null, 6],
  ["Brawling", null, 2],
  ["Evasion", null, 2],
  ["Acting", null, 3],
  ["Conversation", null, 6],
  ["Human Perception", null, 3],
  ["Interrogation", null, 1],
  ["Persuasion", null, 5],
  ["Streetwise", null, 2],
  ["Cybertech", null, 4],
  ["First Aid", null, 6],
  ["Paramedic", null, 6],
  ["Handgun", null, 8],
];

const CYBERWARE = [
  { name: "Cybereyes", slot: "Eyes", detail: "Targeting Scope ×2", sort: 0 },
  { name: "Neural Link", slot: "Neural", detail: "Interface Plugs", sort: 1 },
  { name: "Internal", slot: "Internal", detail: "Nasal Filters · Toxin Binders · Biomonitor", sort: 2 },
  { name: "Linear Frame Σ", slot: "Body", detail: "BODY 12", sort: 3 },
];

const INVENTORY = [
  { name: "Mustang Arms Mark II", category: "weapon", subtitle: "Heavy Pistol", qty: 1, equipped: true, damage: "3d6", rof: 2, mag: "14", detail: "Doc's go-to sidearm — a dependable Mustang Arms frame. Stopping power for when a patch-up turns into a firefight.", sort: 0 },
  { name: "Nova 757 Cityhunter", category: "weapon", subtitle: "Heavy Pistol", qty: 1, equipped: true, damage: "3d6", rof: 2, mag: "18", detail: "Backup heavy pistol — Nova Model 757 Cityhunter.", sort: 1 },
  { name: "Body Armor", category: "armor", subtitle: "SP 11", qty: 1, equipped: true, detail: "Body armor. SP 11.", sort: 2 },
  { name: "Head Armor", category: "armor", subtitle: "SP 11", qty: 1, equipped: true, detail: "Head armor. SP 11.", sort: 3 },
  { name: "Medtech Bag", category: "utility", subtitle: "Medical Kit", qty: 1, detail: "A full medical toolkit in a bag.", sort: 4 },
  { name: "Linear Frame Σ", category: "implant", subtitle: "Borgware", qty: 1, detail: "Sigma linear frame — increases BODY to 12. Requires Interface Plugs.", sort: 5 },
  { name: "Agent", category: "utility", subtitle: "Pocket Comp", qty: 1, detail: "A pocket-sized machine which functions as a computer and phone.", sort: 6 },
  { name: "Computer", category: "utility", subtitle: "Laptop", qty: 1, detail: "Laptop or desktop computer.", sort: 7 },
  { name: "Sedative", category: "utility", subtitle: "Drug", qty: 1, detail: "Knock someone out. +2 bonus to Treatments on a willing patient.", sort: 8 },
  { name: "Speedheal", category: "utility", subtitle: "Drug", qty: 1, detail: "Quickly heals HP.", sort: 9 },
  { name: "Veritas", category: "utility", subtitle: "Drug", qty: 1, detail: "Places a target into a suggestive state for 10 minutes (−5).", sort: 10 },
  { name: "Heavy Pistol Ammo", category: "utility", subtitle: "Basic", qty: 118, sort: 11 },
  { name: "Improved Smart HP Ammo", category: "utility", subtitle: "Improved Smart", qty: 7, sort: 12 },
  { name: "Smart HP Ammo", category: "utility", subtitle: "Smart", qty: 10, sort: 13 },
  { name: "Shotgun Shells", category: "utility", subtitle: "Basic", qty: 24, sort: 14 },
  { name: "Slugs", category: "utility", subtitle: "Basic", qty: 30, sort: 15 },
];

const CONTACTS = [
  { name: "Alicia Makamov", relationship: "Friend", online: true, sort: 0 },
  { name: "Fazalus Ingenjade", relationship: "Friend", online: false, sort: 1 },
  { name: "Kane Shand", relationship: "Friend", online: false, sort: 2 },
  { name: "Emily", relationship: "Love", online: false, sort: 3 },
];

const BACKGROUND = [
  ["personality", "Personality", "No bullshit, all-business type. Cares about the people who care about him.", 0],
  ["motivation", "Motivation", "His daughter and the future.", 1],
  ["cultural_region", "Cultural Region", "American.", 2],
  ["clothing", "Clothing Style", "Teal, old, dirty medical jacket; wife-beater tank top; matching pants; big black boots.", 3],
  ["hairstyle", "Hairstyle", "Greying white hair and beard, combover style.", 4],
  ["affectation", "Affectation", "His missing eye.", 5],
  ["languages", "Languages", "Arabic/Farsi, Street Slang, Chinese, Japanese, English, Norwegian, German, Spanish.", 6],
  ["family_background", "Family Background", "Reclaimers. Started out on the road, then moved into one of the cities' outskirts ghost towns.", 7],
  ["childhood", "Childhood Environment", "Pretty dangerous — had to work hard to make it out of that life.", 8],
  ["family_crisis", "Family Crisis", "His wife died in the warfare between Arasaka and Militech.", 9],
  ["people", "On Most People", "Likes almost everyone. For regular people, he keeps it business.", 10],
  ["medtech_type", "Medtech — Type", "Ripperdoc.", 11],
  ["medtech_partner", "Medtech — Partner", "Has a coworker who acts as a babysitter for his daughter.", 12],
  ["medtech_clients", "Medtech — Main Clients", "Underground people; sometimes folks who know him as the Blood Butcher. His past connects him to certain high-placing medical and tech practitioners.", 13],
  ["medtech_supplies", "Medtech — Supplies", "A backdoor into a few corporate/hospital warehouses; makes everything at home from connections.", 14],
];

const STANDARD_ACTIVITIES = [
  { kind: "standard", name: "Go Shopping", hour_cost: 2, icon: "cart", sort: 0 },
  { kind: "standard", name: "Train a Skill", hour_cost: 4, icon: "star", sort: 1 },
  { kind: "standard", name: "Work a Shift", hour_cost: 6, icon: "clock", sort: 2 },
  { kind: "standard", name: "Ripperdoc", hour_cost: 3, icon: "user", sort: 3 },
  { kind: "standard", name: "Network", hour_cost: 2, icon: "message", sort: 4 },
];

const RANDOM_ACTIVITIES = [
  { kind: "random", name: "Poker Night", with_contact: "Kane Shand", reward: "Unwind · +Bond", skill_check: "Cool vs DV13", deadline_label: "2d 14h", planned_label: "PLANNED · TONIGHT", progress: 6, progress_max: 10, sort: 0 },
  { kind: "random", name: "House Call", with_contact: "Alicia Makamov", reward: "Favor · +Bond", skill_check: "Medtech vs DV17", deadline_label: "5d 03h", progress: 0, progress_max: 0, sort: 1 },
  { kind: "random", name: "Afterlife Drinks", with_contact: "Fazalus Ingenjade", reward: "Unwind · +Bond", skill_check: "Streetwise vs DV14", deadline_label: "19h 40m", progress: 0, progress_max: 0, sort: 2 },
];

// ---------------------------------------------------------------------------
// Global content
// ---------------------------------------------------------------------------
const NEWS = [
  {
    title: "Arasaka Bulletin",
    body: "It has been a month since the death of Eli Arasaka, the lone heir to the Arasaka throne. Arasaka has stayed silent since the tragedy; reports state that internal investigations were conducted. Murder has been confirmed as the cause of death, with five unknown culprits. Arasaka has placed a bounty of 1M eurodollars on each culprit, and warns that an external investigation is coming — the entire city will be placed under rigorous scrutiny.",
    kind: "bulletin",
    sort: 0,
  },
];

const TIMELINE = [
  { session_no: 1, title: "The Shard Job", date_label: "06 MAR 2076", summary: "Vincent hires the crew to recover a stolen shard from Valum. One bad call in Kabuki turns a simple gig into blood, police heat, and a much bigger problem.", full_text: "The Dead Enders are hired by Vincent to recover a stolen shard taken by the rising gang Valum. Their search through Kabuki leads them to a brutal scene filled with blood, torture, and a dying victim. When Frank shoots the injured man in broad daylight, NCPD gets involved, Doc and Frank are detained, and Zeus is forced to pull strings to get them out. The crew recovers the shard, but Vincent already knows they caused heat and cuts their payout. The shard reveals Valum's location — and soon after, Valum calls to warn them to back off.", sort: 0 },
  { session_no: 2, title: "Spark & Eli", date_label: "20 MAR 2076", summary: "The crew tracks Valum to two buildings and clashes with their leader, Spark. The shard is finally within reach — until Eli arrives and turns the whole job into a corporate disaster.", full_text: "The crew pushes into Valum territory and fights through two buildings to reach the gang's leadership. In the final confrontation, they nearly lose to Spark before an outsider named Eli appears, takes the fight into his own hands, and secures the shard. Injured and cornered, Eli becomes the crew's last obstacle, and they kill him before learning who he really is. After returning the shard to Vincent, the truth surfaces: Eli was Eli Arasaka. The crew has now stumbled into something far bigger than a street job.", sort: 1 },
  { session_no: 3, title: "Chrome & Consequences", date_label: "03 APR 2076", summary: "The crew lays low, gets fake IDs at the Night Market, and installs fresh cyberware. Frank's new ARES implant changes everything — and his paranoia nearly gets him killed.", full_text: "With Arasaka heat rising, Vincent orders the crew to keep a low profile and secure new identities. At the Night Market, each member receives unique cyberware, while Frank installs the military-grade ARES implant. Suspicious of Zeus, Frank digs into his background and unknowingly draws Arasaka attention by sending Zeus's image to an old contact. Tensions explode back at the hideout when Frank pulls a gun on Zeus and is immediately dropped by a Biotechnica protection shot. By session's end, Zeus learns that Project X is ARES, Frank has been marked as a prime test subject, and Mohammed quietly places a massive hit on Zeus through David Martinez.", sort: 2 },
  { session_no: 4, title: "Sandy Gone Psycho!", date_label: "17 APR 2076", summary: "Mohammad hires the crew to hunt down and retrieve the body of a Sandevistan user spiraling into cyberpsychosis. The job gets done — then Victor and Steven share a loaded conversation with Mohammad at Lizzie's Bar.", full_text: "Mohammad hires the crew to kill and recover the body of a Sandevistan user running wild on the edge of cyberpsychosis. They track the user down and complete the mission clean. Afterward, Victor and Steven sit down with Mohammad the fixer at Lizzie's Bar for a conversation that raises as many questions as it answers. TBD…", sort: 3 },
];

// Prices locked to plan §7.4 (grid order): 500·350·5,000·3,500·500·500·500·25,000.
const CATALOG = [
  { name: 'Militech "Lexington"', category: "weapon", subtitle: "Heavy Pistol", price: 500, sort: 0 },
  { name: "Nova", category: "weapon", subtitle: "Med Pistol", price: 350, sort: 1 },
  { name: 'Tsunami "Nekomata"', category: "weapon", subtitle: "Sniper", price: 5000, sort: 2 },
  { name: "Kendachi Katana", category: "weapon", subtitle: "Melee", price: 3500, sort: 3 },
  { name: 'Arasaka "Rasetsu"', category: "weapon", subtitle: "Smart SMG", price: 500, sort: 4 },
  { name: 'Militech "Crusher"', category: "weapon", subtitle: "Shotgun", price: 500, sort: 5 },
  { name: "Kevlar Vest", category: "armor", subtitle: "Armor SP 11", price: 500, sort: 6 },
  { name: "Sandevistan", category: "implant", subtitle: "Implant", price: 25000, sort: 7 },
];

async function delOwned(table, owner) {
  const { error } = await admin.from(table).delete().eq("owner", owner);
  if (error) die(`clear ${table}`, error);
}
async function insert(table, rows) {
  if (rows.length === 0) return;
  const { error } = await admin.from(table).insert(rows);
  if (error) die(`insert ${table}`, error);
}

async function main() {
  console.log("Seeding NETRUN OS Phase 1 content…");

  const steven = await findUserId(STEVEN_EMAIL);
  if (!steven) die("find Steven", `no user ${STEVEN_EMAIL} (run seed-accounts.mjs first)`);

  // character_sheet patch
  {
    const { error } = await admin.from("character_sheet").update(SHEET_PATCH).eq("owner", steven);
    if (error) die("patch character_sheet", error);
    console.log("  · patched character_sheet (handle/role/eddies)");
  }

  // skills — resolve skill_def names to ids
  {
    const { data: defs, error } = await admin.from("skill_def").select("id, name");
    if (error) die("read skill_def", error);
    const idByName = new Map(defs.map((d) => [d.name, d.id]));
    const rows = [];
    for (const [name, spec, level] of SKILLS) {
      const skill_def_id = idByName.get(name);
      if (!skill_def_id) {
        console.warn(`  ! skill_def "${name}" missing — did 0003 apply?`);
        continue;
      }
      rows.push({ owner: steven, skill_def_id, spec, level });
    }
    await delOwned("skill", steven);
    await insert("skill", rows);
    console.log(`  · seeded ${rows.length} skills`);
  }

  // owner-scoped content
  await delOwned("cyberware", steven);
  await insert("cyberware", CYBERWARE.map((c) => ({ ...c, owner: steven })));
  await delOwned("inventory_item", steven);
  // `equipped` default first so every row explicitly carries it — PostgREST fills
  // ANY key missing from an individual row (in a batch insert) with a literal null,
  // rather than leaving it to the column default, which would violate NOT NULL.
  await insert("inventory_item", INVENTORY.map((i) => ({ equipped: false, ...i, owner: steven })));
  await delOwned("contact", steven);
  await insert("contact", CONTACTS.map((c) => ({ ...c, owner: steven })));
  await delOwned("mission", steven);
  await insert("mission", [{ owner: steven, title: "Search for Hailey Phantom in Day City", status: "current", sort: 0 }]);
  await delOwned("free_time_ledger", steven);
  await insert("free_time_ledger", [{ owner: steven, hours_remaining: 14, hours_total: 24 }]);
  await delOwned("character_background", steven);
  await insert("character_background", BACKGROUND.map(([slot, label, body, sort]) => ({ owner: steven, slot, label, body, sort })));
  await delOwned("activity", steven);
  await insert("activity", RANDOM_ACTIVITIES.map((a) => ({ ...a, owner: steven })));
  console.log("  · seeded cyberware / inventory / contacts / mission / free-time / background / random activities");

  // global content (delete-all + insert — this script is the only source)
  {
    const { error } = await admin.from("activity").delete().is("owner", null);
    if (error) die("clear standard activities", error);
    await insert("activity", STANDARD_ACTIVITIES);
  }
  for (const [table, rows] of [
    ["news_post", NEWS],
    ["timeline_event", TIMELINE],
    ["catalog_item", CATALOG],
  ]) {
    const { error } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) die(`clear ${table}`, error);
    await insert(table, rows);
  }
  {
    const closes = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const { error } = await admin
      .from("store_settings")
      .upsert({ singleton: true, is_open: true, closes_at: closes, note: "Same catalog for the crew · view-only this phase" }, { onConflict: "singleton" });
    if (error) die("upsert store_settings", error);
  }
  console.log("  · seeded news / timeline / catalog / store settings + standard activities");

  console.log("\nDone. Log in as", STEVEN_EMAIL, "and walk all 7 tabs.");
}

main().catch((e) => die("seed", e));
