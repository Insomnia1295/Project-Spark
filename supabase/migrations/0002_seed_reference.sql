-- NETRUN OS — Phase 0 reference-data seed.
-- The skill -> governing-stat map (§4.2). This is editable data (GM-owned), NOT
-- hard-coded in the client. Displayed skill value = level + governing stat.
-- The plan validated: Education+INT, Conversation+EMP, Persuasion+COOL, Concentration+WILL.

insert into public.skill_def (name, gov_stat, category) values
  -- INT
  ('Accounting',          'INT', 'Education'),
  ('Bureaucracy',         'INT', 'Education'),
  ('Business',            'INT', 'Education'),
  ('Criminology',         'INT', 'Education'),
  ('Deduction',           'INT', 'Awareness'),
  ('Education',           'INT', 'Education'),
  ('Library Search',      'INT', 'Education'),
  ('Perception',          'INT', 'Awareness'),
  ('Tactics',             'INT', 'Education'),
  ('Wilderness Survival', 'INT', 'Education'),
  -- REF
  ('Autofire',            'REF', 'Combat'),
  ('Brawling',            'REF', 'Combat'),
  ('Evasion',             'DEX', 'Combat'),
  ('Handgun',             'REF', 'Combat'),
  ('Heavy Weapons',       'REF', 'Combat'),
  ('Martial Arts',        'REF', 'Combat'),
  ('Melee Weapon',        'REF', 'Combat'),
  ('Shoulder Arms',       'REF', 'Combat'),
  -- DEX
  ('Athletics',           'DEX', 'Body'),
  ('Stealth',             'DEX', 'Body'),
  -- TECH
  ('Basic Tech',          'TECH', 'Technique'),
  ('Cybertech',           'TECH', 'Technique'),
  ('Demolitions',         'TECH', 'Technique'),
  ('Electronics/Security','TECH', 'Technique'),
  ('First Aid',           'TECH', 'Technique'),
  ('Paramedic',           'TECH', 'Technique'),
  ('Pick Lock',           'TECH', 'Technique'),
  ('Weaponstech',         'TECH', 'Technique'),
  -- COOL
  ('Acting',              'COOL', 'Social'),
  ('Bribery',             'COOL', 'Social'),
  ('Interrogation',       'COOL', 'Social'),
  ('Persuasion',          'COOL', 'Social'),
  ('Streetwise',          'COOL', 'Social'),
  ('Trading',             'COOL', 'Social'),
  ('Wardrobe & Style',    'COOL', 'Social'),
  -- WILL
  ('Concentration',       'WILL', 'Awareness'),
  ('Conceal/Reveal Object','WILL','Awareness'),
  ('Resist Torture/Drugs','WILL', 'Awareness'),
  -- EMP
  ('Conversation',        'EMP', 'Social'),
  ('Human Perception',    'EMP', 'Social')
on conflict (name) do nothing;

insert into public.content_version (kind, version) values
  ('schema', 1),
  ('skill_def', 1)
on conflict (kind) do nothing;
