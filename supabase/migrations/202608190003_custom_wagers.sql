create table if not exists public.custom_wagers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  terms text not null,
  stake_amount numeric(12,2) not null check (stake_amount > 0),
  platform_fee_percent numeric(5,2) not null default 10,
  status text not null default 'pending_acceptance',
  creator_funded boolean not null default false,
  opponent_funded boolean not null default false,
  creator_claim text,
  opponent_claim text,
  winner_id uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_reason text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_wager_evidence (
  id uuid primary key default gen_random_uuid(),
  custom_wager_id uuid not null references public.custom_wagers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_wager_resolution_logs (
  id uuid primary key default gen_random_uuid(),
  custom_wager_id uuid not null references public.custom_wagers(id) on delete cascade,
  resolved_by uuid references auth.users(id) on delete set null,
  decision text not null,
  reason text,
  created_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('custom_wager_fee_percent', '10'),
  ('custom_wager_min_stake', '100'),
  ('custom_wager_max_stake', '100000')
on conflict (key) do nothing;

create index if not exists custom_wagers_participants_idx on public.custom_wagers (creator_id, opponent_id, status, created_at desc);
create index if not exists custom_wagers_status_idx on public.custom_wagers (status, created_at desc);
