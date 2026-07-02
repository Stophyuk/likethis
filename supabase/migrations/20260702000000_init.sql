-- likethis schema (single user)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 Run 하세요.

-- app state: settings, notify flags
create table if not exists kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- one row per published day (streak source of truth)
create table if not exists published (
  date text primary key, -- YYYY-MM-DD (KST)
  at timestamptz not null default now(),
  preview text
);

-- daily topic suggestions
create table if not exists suggestions (
  date text primary key, -- YYYY-MM-DD (KST)
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- finished pieces (archive; reads capped in app)
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  variations jsonb not null,
  created_at timestamptz not null default now()
);

-- Block anonymous access; the app uses the service-role key (bypasses RLS).
alter table kv enable row level security;
alter table published enable row level security;
alter table suggestions enable row level security;
alter table history enable row level security;
