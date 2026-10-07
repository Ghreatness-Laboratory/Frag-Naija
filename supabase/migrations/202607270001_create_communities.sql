create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  game_slug text not null,
  tier text not null default 'Open',
  name text not null,
  description text,
  whatsapp_url text,
  discord_url text,
  status text not null default 'Published' check (status in ('Draft', 'Published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communities_game_slug_idx on public.communities(game_slug);
create index if not exists communities_tier_idx on public.communities(tier);
create index if not exists communities_status_idx on public.communities(status);
