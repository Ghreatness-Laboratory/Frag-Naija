-- News engagement MVP for the Supabase replacement app.
-- Uses public-schema tables linked to auth.users; does not touch legacy auth_user or frag_api_* tables.

alter table if exists public.news
  add column if not exists excerpt text,
  add column if not exists published_at timestamptz,
  add column if not exists pinned boolean not null default false,
  add column if not exists like_count_offset integer not null default 0,
  add column if not exists view_count_offset integer not null default 0;

update public.news
set published_at = coalesce(published_at, created_at)
where published_at is null;

create table if not exists public.news_likes (
  article_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.news_views (
  article_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  view_count integer not null default 1,
  primary key (article_id, user_id)
);

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_published_pinned_idx on public.news (published, pinned desc, published_at desc, created_at desc);
create index if not exists news_comments_article_created_idx on public.news_comments (article_id, created_at desc);
create index if not exists news_likes_article_idx on public.news_likes (article_id);
create index if not exists news_views_article_idx on public.news_views (article_id);
