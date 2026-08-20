-- Add category and game_slug fields to news articles for filtering.
-- Uses public-schema tables linked to auth.users; does not touch legacy auth_user or frag_api_* tables.

alter table if exists public.news
  add column if not exists category text check (category in ('Trending', 'Hot', 'Gossip', 'Transfer News')),
  add column if not exists game_slug text;

create index if not exists news_category_idx on public.news (category);
create index if not exists news_game_slug_idx on public.news (game_slug);
