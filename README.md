# Frag Naija

Frag Naija is a Nigeria-focused esports media and engagement platform. The product is designed to feel like a tactical command center for the local competitive gaming scene, where fans can follow elite squads, discover standout players, watch highlights, track transfers, monitor tournament action, and interact with live wager markets around major matchups.

At the product level, Frag Naija brings together:
- a home page that frames the platform as Nigeria's esports command hub
- athlete discovery and ranking views for top players
- team and roster exploration for tactical squads
- tournament coverage with standings, brackets, and live-feed presentation
- a highlight theatre for match replays, clutch moments, and tactical logs
- a transfer window for player movement and market activity
- a wager zone for prediction-style markets and payout flows

Technically, the project currently ships with:
- a styled frontend for home, athletes, teams, tournaments, transfer window, highlights, and wager views
- REST-style API routes under `src/app/api`
- a feature-based backend layer under `src/features`
- Supabase-backed data, auth, wallet, and storage integrations
- Paystack payment initialization and webhook handling for wagers

## Table of Contents

- [Product Overview](#product-overview)
- [Tech Stack](#tech-stack)
- [What The App Covers](#what-the-app-covers)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database And Storage Setup](#database-and-storage-setup)
- [API Surface](#api-surface)
- [Auth Model](#auth-model)
- [Current State Of The Frontend](#current-state-of-the-frontend)
- [Scripts](#scripts)
- [Deployment Notes](#deployment-notes)

## Product Overview

Frag Naija is not just a scoreboard or admin panel. It is structured like a fan-facing esports destination with multiple engagement layers:

- **Discover**: browse athletes, squads, and featured talent in the Nigerian scene
- **Follow**: keep up with tournaments, live feeds, standings, and match narratives
- **Watch**: consume archived highlights, tactical logs, and replay-style content
- **Track**: monitor transfers, free-agent movement, and roster activity
- **Engage**: enter the wager zone for prediction-style participation around matches and outcomes

The frontend language, page names, and visual design all reinforce that product direction:

- athletes are presented like elite operators
- teams are presented like tactical commands and squads
- tournaments are framed as national circuits and championship events
- highlights are presented as a "theatre of war"
- wagers are framed as a tactical prediction market

## Tech Stack

- **Framework**: Next.js 14 App Router
- **UI**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Backend data/auth/storage**: Supabase
- **Payments**: Paystack
- **Language mix**: TypeScript for app UI, JavaScript for API/server modules

## What The App Covers

- **Athletes**: player profiles, rankings, operator-style presentation, roster browsing
- **Teams**: team records, roster aggregation, regional context, leaderboard-style views
- **Tournaments**: listing, standings, bracket coverage, live-feed presentation, prize pool metadata
- **Transfers**: player movement, rumours, pending payables, and transfer activity
- **Highlights**: featured clips, archive coverage, replays, montages, and tactical logs
- **Wagers**: active markets, prediction-style buy yes/buy no flow, settlement, and wallets
- **Admin-only operations**: protected create/update/delete flows and upload support

## Project Structure

```text
.
+-- middleware.js                  # Protects /admin routes
+-- src/
|   +-- app/
|   |   +-- api/                   # Public API route handlers
|   |   +-- athletes/
|   |   +-- highlights/
|   |   +-- teams/
|   |   +-- tournaments/
|   |   +-- transfer-window/
|   |   +-- wager/
|   |   `-- page.tsx               # Landing page
|   +-- components/                # Layout and shared UI pieces
|   +-- features/                  # Feature-based backend modules
|   |   +-- athletes/
|   |   +-- auth/
|   |   +-- highlights/
|   |   +-- shared/server/
|   |   +-- teams/
|   |   +-- tournaments/
|   |   +-- transfers/
|   |   `-- wagers/
|   `-- lib/
|       +-- data.ts                # seeded frontend display data
|       +-- hooks.js               # frontend data-fetching hooks
|       +-- paystack.js            # Paystack helpers
|       `-- *.js                   # compatibility re-exports into features/*
`-- supabase/
    `-- schema.sql                 # Supabase SQL bootstrap file
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local environment file

```bash
copy .env.example .env.local
```

On macOS/Linux use:

```bash
cp .env.example .env.local
```

### 3. Fill in the required environment variables

See [Environment Variables](#environment-variables) below.

### 4. Set up Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the contents of `supabase/schema.sql`.
4. Create public storage buckets named:
   - `athletes`
   - `teams`
   - `highlights`
   - `team-members`
   - `shop-items`

### 5. Start the app

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Environment Variables

The project expects these values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser-safe Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for privileged API operations |
| `PAYSTACK_SECRET_KEY` | Yes for wager payments | Server-side Paystack API access and webhook verification |
| `ADMIN_PASSWORD` | Yes for admin routes | Password used by `/api/auth/admin` and `/admin/*` protection |
| `NEXT_PUBLIC_SITE_URL` | Yes for payment callback URLs | Base site URL used in Paystack callback configuration |

The checked-in `.env.example` already shows the exact variable names.

## Database And Storage Setup

`supabase/schema.sql` bootstraps the core domain tables:

- `teams`
- `athletes`
- `transfers`
- `tournaments`
- `wagers`
- `wager_bets`
- `wallets`
- `highlights`

It also creates:

- row level security policies for public reads and app-layer-controlled writes
- the `increment_wager_pool` RPC function for atomic wager pool updates

Storage is used by the upload API:

- `/api/upload`
- allowed buckets: `athletes`, `teams`, `highlights`, `team-members`, `shop-items`
- max file size: `10MB`

## API Surface

These route groups exist today:

- `/api/auth`
  - `POST /api/auth/admin`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/register`
- `/api/athletes`
- `/api/teams`
- `/api/transfers`
- `/api/tournaments`
- `/api/highlights`
- `/api/wagers`
- `/api/wager/pay`
- `/api/wager/webhook`
- `/api/upload`

The route handlers live in `src/app/api`, while the actual server logic is organized by domain in `src/features`.

## Auth Model

There are two auth paths in this codebase:

### User auth

- handled through Supabase email/password login
- `POST /api/auth/login` stores a `sb-access-token` cookie
- `GET /api/auth/me` resolves the current user and wallet from that token

### Admin auth

- handled separately with `POST /api/auth/admin`
- admin-only routes use `checkAdmin()`
- `/admin/*` is guarded by `middleware.js`

## Current State Of The Frontend

The backend and API layer are wired for live data, but not every page consumes those APIs yet.

Right now:

- `src/lib/hooks.js` contains fetch hooks for the live APIs
- several UI pages still read seeded data directly from `src/lib/data.ts`
- the backend has already been reorganized into a feature-based server layer under `src/features`

That means the project is in a hybrid state:

- **frontend presentation** is largely mock-driven
- **backend/API** is ready for live Supabase-backed flows

In practical terms, the product experience is already visible, but some of the public pages are still using seeded content to simulate the final experience while the live backend catches up.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run Next.js ESLint checks |

## Deployment Notes

There is no platform-specific deployment config committed yet. The current app is best treated as a standard Next.js deployment with required environment variables supplied at runtime.

Before production deployment, make sure you have:

- a live Supabase project with the schema applied
- the three public storage buckets created
- a valid `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL` pointed at your deployed domain
- a strong `ADMIN_PASSWORD`

If you deploy on Vercel, Render, Railway, or another Node-compatible host, the main requirement is that all environment variables are configured correctly.

## Development Notes

- `src/features/*` is now the source of truth for backend business logic.
- `src/lib/db.js`, `src/lib/checkAdmin.js`, and `src/lib/supabase-admin.js` are compatibility shims.
- `middleware.js` currently protects admin paths by checking the `admin_auth` cookie.

## Next Recommended Step

The most natural next improvement is to migrate the frontend pages from `src/lib/data.ts` to the live API hooks in `src/lib/hooks.js`, so the UI reflects real Supabase data end-to-end.

### Supabase Match Alert scheduler

The Match Alert dispatcher is scheduled by Supabase `pg_cron`, not Vercel. The cron job runs every minute (`* * * * *`) and the dispatcher sends the “Match starting in 5 minutes” alert for matches in the safe 4–6 minute lookahead window. Before applying `202608240003_supabase_match_alert_scheduler.sql`, enable **pg_cron**, **pg_net**, and **Vault** for the Supabase project. On hosted Supabase, enable these from **Dashboard → Database → Extensions** if raw `CREATE EXTENSION` statements are not permitted, then run the migration SQL.

Create these Vault secrets in the Supabase Dashboard, or through the secure Vault workflow, before scheduling the job:

- `match_alert_scheduler_url`: the HTTPS origin of the deployed application, without a path.
- `match_alert_scheduler_secret`: a high-entropy shared secret. Set this to the exact same value as the Vercel environment variable `SUPABASE_MATCH_ALERT_SCHEDULER_SECRET`. Never expose it with a `NEXT_PUBLIC_` prefix.

The scheduled function posts to `/api/internal/match-alerts/dispatch` with `Authorization: Bearer <match_alert_scheduler_secret>`. The migration replaces any existing `fragnaija-match-alerts-every-minute` job and schedules exactly one `* * * * *` job. The endpoint uses recipient-scoped delivery, so a failed FCM request does not remove the in-app notification already written for an eligible subscriber.

Run this SQL in Supabase after setting the two Vault secrets:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_match_alert_scheduler()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'match_alert_scheduler_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'match_alert_scheduler_secret';

  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    raise exception 'Match-alert scheduler Vault secrets are not configured.';
  end if;

  perform net.http_post(
    url := regexp_replace(v_url, '/+$', '') || '/api/internal/match-alerts/dispatch',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.invoke_match_alert_scheduler() from public;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'fragnaija-match-alerts-every-minute'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'fragnaija-match-alerts-every-minute',
  '* * * * *',
  'select public.invoke_match_alert_scheduler();'
);
```
