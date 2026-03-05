-- ══════════════════════════════════════════════════════════════
-- SKY SOURCE — COMPLETE SCHEMA (run this once on a fresh project)
-- Supabase → SQL Editor → paste entire file → Run
-- ══════════════════════════════════════════════════════════════

-- ── 1. DROP everything cleanly (safe re-run) ─────────────────
drop table if exists public.audit_trail       cascade;
drop table if exists public.activity_log      cascade;
drop table if exists public.otp_codes         cascade;
drop table if exists public.snapshots         cascade;
drop table if exists public.checklist_entries cascade;
drop table if exists public.checklists        cascade;
drop table if exists public.lob_fields        cascade;
drop table if exists public.lobs              cascade;
drop table if exists public.users             cascade;

-- ── 2. USERS ──────────────────────────────────────────────────
create table public.users (
  id            uuid        primary key default gen_random_uuid(),
  username      text        unique not null,
  fullname      text,
  email         text,
  password_hash text        not null,
  role          text        not null default 'user'
                            check (role in ('master_admin', 'admin', 'user')),
  created_at    timestamptz default now()
);

-- ── 3. LOBs ───────────────────────────────────────────────────
create table public.lobs (
  id         text    primary key,
  name       text    unique not null,
  code       text    not null,
  locked     boolean default false,
  sort_order integer default 0
);

-- ── 4. LOB FIELDS ─────────────────────────────────────────────
create table public.lob_fields (
  id         bigserial primary key,
  lob_id     text      references public.lobs(id) on delete cascade,
  lob_name   text      not null,
  field_id   text      not null,
  label      text      not null,
  is_header  boolean   default false,
  sort_order integer   default 0
);

-- ── 5. CHECKLISTS ─────────────────────────────────────────────
create table public.checklists (
  id           bigserial   primary key,
  user_id      uuid        references public.users(id) on delete set null,
  username     text,
  insured      text,
  policy       text,
  term         text,
  date         text,
  checkedby    text,
  am           text,
  lobs         text[]      default '{}',
  notes        text        default '',
  status       text        default 'draft' check (status in ('draft','complete')),
  updated_at   timestamptz default now(),
  completed_at timestamptz
);

-- ── 6. CHECKLIST ENTRIES ──────────────────────────────────────
create table public.checklist_entries (
  id           bigserial primary key,
  checklist_id bigint    references public.checklists(id) on delete cascade,
  field_id     text      not null,
  pg           text      default '',
  pol          text      default '',
  nex          text      default '',
  status       text      default 'N/A',
  sky_comments text      default '',
  am_comments  text      default '',
  unique (checklist_id, field_id)
);

-- ── 7. SNAPSHOTS ──────────────────────────────────────────────
create table public.snapshots (
  id                bigserial   primary key,
  checklist_id      bigint      references public.checklists(id) on delete cascade,
  position          integer     not null,
  policy_image_url  text,
  nexsure_image_url text,
  notes             text        default '',
  created_at        timestamptz default now(),
  expires_at        timestamptz,
  unique (checklist_id, position)
);

-- ── 8. AUDIT TRAIL ────────────────────────────────────────────
create table public.audit_trail (
  id           uuid        primary key default gen_random_uuid(),
  checklist_id bigint      not null,
  user_id      uuid,
  username     text        not null,
  field_id     text,
  field_label  text,
  section      text,
  change_type  text        not null,
  old_value    text,
  new_value    text,
  created_at   timestamptz default now() not null
);
create index idx_audit_trail_checklist on public.audit_trail(checklist_id, created_at desc);

-- ── 9. ACTIVITY LOG ───────────────────────────────────────────
create table public.activity_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid,
  username    text        not null,
  action_type text        not null,
  detail      text        default '{}',
  created_at  timestamptz default now() not null
);
create index idx_activity_log_created_at  on public.activity_log(created_at desc);
create index idx_activity_log_user_id     on public.activity_log(user_id);
create index idx_activity_log_action_type on public.activity_log(action_type);

-- ── 10. DISABLE RLS (API uses service role key) ───────────────
alter table public.users             disable row level security;
alter table public.lobs              disable row level security;
alter table public.lob_fields        disable row level security;
alter table public.checklists        disable row level security;
alter table public.checklist_entries disable row level security;
alter table public.snapshots         disable row level security;
alter table public.audit_trail       disable row level security;
alter table public.activity_log      disable row level security;

-- ══════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────────────
-- Rudra is master_admin. Change password after first login!
insert into public.users (username, fullname, email, password_hash, role) values
  ('Rudra',     'Rudra Admin', 'rudra@skysource.com',     'Markofcain', 'master_admin'),
  ('sarah.kim', 'Sarah Kim',   'sarah.kim@skysource.com', 'sarah123',   'user'),
  ('jdoe',      'John Doe',    'jdoe@skysource.com',      'jdoe123',    'user')
on conflict (username) do nothing;

-- ── LOBs ──────────────────────────────────────────────────────
insert into public.lobs (id, name, code, locked, sort_order) values
  ('common-dec',    'Common Declarations',           'COM',  true,  1),
  ('gl',            'General Liability',              'GL',   false, 2),
  ('ca',            'Commercial Auto',                'CA',   false, 3),
  ('wc',            'Workers'' Compensation',         'WC',   false, 4),
  ('cp',            'Commercial Property',            'CP',   false, 5),
  ('umb',           'Umbrella / Excess',              'UMB',  false, 6),
  ('eo',            'Professional Liability / E&O',   'EO',   false, 7),
  ('cyber',         'Cyber Liability',                'CY',   false, 8),
  ('do',            'Directors & Officers (D&O)',     'DO',   false, 9),
  ('crime',         'Crime / Fidelity',               'CR',   false, 10),
  ('epli',          'Employment Practices Liability', 'EPLI', false, 11),
  ('inland-marine', 'Inland Marine',                  'IM',   false, 12)
on conflict (id) do nothing;

-- ── LOB Fields ────────────────────────────────────────────────
insert into public.lob_fields (lob_id, lob_name, field_id, label, is_header, sort_order) values
-- Common Declarations
  ('common-dec','Common Declarations','cd-h1','Named Insured & Address',true,1),
  ('common-dec','Common Declarations','cd-1','Named Insured',false,2),
  ('common-dec','Common Declarations','cd-2','Mailing Address',false,3),
  ('common-dec','Common Declarations','cd-h2','Policy Information',true,4),
  ('common-dec','Common Declarations','cd-3','Policy Number',false,5),
  ('common-dec','Common Declarations','cd-4','Policy Effective Date',false,6),
  ('common-dec','Common Declarations','cd-5','Policy Expiration Date',false,7),
  ('common-dec','Common Declarations','cd-6','Business Description',false,8),
  ('common-dec','Common Declarations','cd-7','Carrier / Insurance Company',false,9),
  ('common-dec','Common Declarations','cd-8','Total Policy Premium',false,10),
-- General Liability
  ('gl','General Liability','gl-h1','General Liability Declarations',true,1),
  ('gl','General Liability','gl-1','Occurrence Limit',false,2),
  ('gl','General Liability','gl-2','General Aggregate Limit',false,3),
  ('gl','General Liability','gl-3','Products-Completed Ops Aggregate',false,4),
  ('gl','General Liability','gl-4','Personal & Advertising Injury',false,5),
  ('gl','General Liability','gl-5','Damage to Premises Rented',false,6),
  ('gl','General Liability','gl-h2','Endorsements',true,7),
  ('gl','General Liability','gl-6','Additional Insureds',false,8),
  ('gl','General Liability','gl-7','Waiver of Subrogation',false,9),
  ('gl','General Liability','gl-8','Primary & Non-Contributory',false,10),
  ('gl','General Liability','gl-9','GL Premium',false,11),
-- Commercial Auto
  ('ca','Commercial Auto','ca-h1','Auto Declarations',true,1),
  ('ca','Commercial Auto','ca-1','Liability Limit (CSL)',false,2),
  ('ca','Commercial Auto','ca-2','Medical Payments',false,3),
  ('ca','Commercial Auto','ca-3','Comprehensive Deductible',false,4),
  ('ca','Commercial Auto','ca-4','Collision Deductible',false,5),
  ('ca','Commercial Auto','ca-h2','Schedule of Vehicles',true,6),
  ('ca','Commercial Auto','ca-5','Year / Make / Model',false,7),
  ('ca','Commercial Auto','ca-6','Garaging Address',false,8),
  ('ca','Commercial Auto','ca-7','CA Premium',false,9),
-- Workers Compensation
  ('wc','Workers'' Compensation','wc-h1','Workers'' Compensation Declarations',true,1),
  ('wc','Workers'' Compensation','wc-1','State(s) of Coverage',false,2),
  ('wc','Workers'' Compensation','wc-2','Employers Liability - Each Accident',false,3),
  ('wc','Workers'' Compensation','wc-3','Employers Liability - Disease (Policy)',false,4),
  ('wc','Workers'' Compensation','wc-4','Employers Liability - Disease (Each Emp)',false,5),
  ('wc','Workers'' Compensation','wc-5','Experience Modification Factor',false,6),
  ('wc','Workers'' Compensation','wc-6','Officers Included/Excluded',false,7),
  ('wc','Workers'' Compensation','wc-7','WC Premium',false,8),
-- Commercial Property
  ('cp','Commercial Property','cp-h1','Property Declarations',true,1),
  ('cp','Commercial Property','cp-1','Location Address',false,2),
  ('cp','Commercial Property','cp-2','Building Limit',false,3),
  ('cp','Commercial Property','cp-3','Business Personal Property Limit',false,4),
  ('cp','Commercial Property','cp-4','Deductible',false,5),
  ('cp','Commercial Property','cp-h2','Business Income',true,6),
  ('cp','Commercial Property','cp-5','BI Limit',false,7),
  ('cp','Commercial Property','cp-6','BI Coinsurance',false,8),
  ('cp','Commercial Property','cp-7','CP Premium',false,9),
-- Umbrella
  ('umb','Umbrella / Excess','umb-h1','Umbrella Declarations',true,1),
  ('umb','Umbrella / Excess','umb-1','Each Occurrence Limit',false,2),
  ('umb','Umbrella / Excess','umb-2','Aggregate Limit',false,3),
  ('umb','Umbrella / Excess','umb-3','Retained Limit / SIR',false,4),
  ('umb','Umbrella / Excess','umb-4','Umbrella Premium',false,5),
-- E&O
  ('eo','Professional Liability / E&O','eo-h1','E&O Declarations',true,1),
  ('eo','Professional Liability / E&O','eo-1','Each Claim Limit',false,2),
  ('eo','Professional Liability / E&O','eo-2','Aggregate Limit',false,3),
  ('eo','Professional Liability / E&O','eo-3','Retroactive Date',false,4),
  ('eo','Professional Liability / E&O','eo-4','Deductible',false,5),
  ('eo','Professional Liability / E&O','eo-5','E&O Premium',false,6),
-- Cyber
  ('cyber','Cyber Liability','cy-h1','Cyber Declarations',true,1),
  ('cyber','Cyber Liability','cy-1','First Party Coverage Limit',false,2),
  ('cyber','Cyber Liability','cy-2','Third Party Liability Limit',false,3),
  ('cyber','Cyber Liability','cy-3','Ransomware / Extortion Limit',false,4),
  ('cyber','Cyber Liability','cy-4','Deductible',false,5),
  ('cyber','Cyber Liability','cy-5','Retroactive Date',false,6),
  ('cyber','Cyber Liability','cy-6','Cyber Premium',false,7),
-- D&O
  ('do','Directors & Officers (D&O)','do-h1','D&O Declarations',true,1),
  ('do','Directors & Officers (D&O)','do-1','Limit of Liability',false,2),
  ('do','Directors & Officers (D&O)','do-2','Retention (Individual)',false,3),
  ('do','Directors & Officers (D&O)','do-3','Retention (Corporate)',false,4),
  ('do','Directors & Officers (D&O)','do-4','Retroactive Date',false,5),
  ('do','Directors & Officers (D&O)','do-5','D&O Premium',false,6),
-- Crime
  ('crime','Crime / Fidelity','cr-h1','Crime Declarations',true,1),
  ('crime','Crime / Fidelity','cr-1','Employee Dishonesty Limit',false,2),
  ('crime','Crime / Fidelity','cr-2','Computer Fraud Limit',false,3),
  ('crime','Crime / Fidelity','cr-3','Funds Transfer Fraud Limit',false,4),
  ('crime','Crime / Fidelity','cr-4','Deductible',false,5),
  ('crime','Crime / Fidelity','cr-5','Crime Premium',false,6),
-- EPLI
  ('epli','Employment Practices Liability','ep-h1','EPLI Declarations',true,1),
  ('epli','Employment Practices Liability','ep-1','Each Claim Limit',false,2),
  ('epli','Employment Practices Liability','ep-2','Aggregate Limit',false,3),
  ('epli','Employment Practices Liability','ep-3','Retention',false,4),
  ('epli','Employment Practices Liability','ep-4','Retroactive Date',false,5),
  ('epli','Employment Practices Liability','ep-5','EPLI Premium',false,6),
-- Inland Marine
  ('inland-marine','Inland Marine','im-h1','Inland Marine Declarations',true,1),
  ('inland-marine','Inland Marine','im-1','Coverage Type',false,2),
  ('inland-marine','Inland Marine','im-2','Limit of Insurance',false,3),
  ('inland-marine','Inland Marine','im-3','Deductible',false,4),
  ('inland-marine','Inland Marine','im-4','IM Premium',false,5)
on conflict do nothing;

-- ── Sample Checklists ─────────────────────────────────────────
insert into public.checklists (user_id, username, insured, policy, term, date, checkedby, am, lobs, status, updated_at)
select id, 'Rudra', 'Sunrise Logistics LLC', 'GL-2024-00142', '01/01/2024 – 01/01/2025', '2024-03-15', 'Rudra', 'Sarah Kim', array['General Liability'], 'draft', now() - interval '2 days'
from public.users where username = 'Rudra' limit 1;

insert into public.checklists (user_id, username, insured, policy, term, date, checkedby, am, lobs, status, updated_at, completed_at)
select id, 'sarah.kim', 'Meridian Contractors', 'WC-2024-00089', '01/01/2024 – 01/01/2025', '2024-03-12', 'Sarah Kim', 'Sarah Kim', array['Workers'' Compensation'], 'complete', now() - interval '1 day', now() - interval '1 day'
from public.users where username = 'sarah.kim' limit 1;

insert into public.checklists (user_id, username, insured, policy, term, date, checkedby, am, lobs, status, updated_at)
select id, 'Rudra', 'Blue River Holdings', 'CA-2024-00231', '01/01/2024 – 01/01/2025', '2024-03-10', 'Rudra', 'Sarah Kim', array['Commercial Auto'], 'draft', now() - interval '3 days'
from public.users where username = 'Rudra' limit 1;

insert into public.checklists (user_id, username, insured, policy, term, date, checkedby, am, lobs, status, updated_at, completed_at)
select id, 'jdoe', 'Pinnacle Industries', 'PKG-2024-00517', '01/01/2024 – 01/01/2025', '2024-03-08', 'John Doe', 'Sarah Kim', array['General Liability','Commercial Property','Commercial Auto'], 'complete', now() - interval '4 days', now() - interval '4 days'
from public.users where username = 'jdoe' limit 1;

-- ══════════════════════════════════════════════════════════════
-- DONE. Tables created:
--   users, lobs, lob_fields, checklists, checklist_entries,
--   snapshots, audit_trail, activity_log
--
-- Master admin: username=Rudra / password=Markofcain
-- Change the password after first login!
-- ══════════════════════════════════════════════════════════════
