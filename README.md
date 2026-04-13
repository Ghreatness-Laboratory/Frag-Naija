# Frag Naija

Frag Naija is a Nigeria-focused esports platform built with Next.js. It combines public-facing tournament content, athlete and team discovery, highlight reels, transfer tracking, and a wager flow backed by Supabase and Paystack.

The project currently ships with:
- a styled frontend for home, athletes, teams, tournaments, transfer window, highlights, and wager views
- REST-style API routes under `src/app/api`
- a feature-based backend layer under `src/features`
- Supabase-backed data, auth, wallet, and storage integrations
- Paystack payment initialization and webhook handling for wagers

## Table of Contents

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

- **Athletes**: player profiles, rankings, roster browsing
- **Teams**: team records, roster aggregation, regional context
- **Tournaments**: listing, status tracking, prize pool metadata
- **Transfers**: player movement and transfer activity
- **Highlights**: featured clips and highlight records
- **Wagers**: active markets, bet placement flow, settlement, wallets
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
- allowed buckets: `athletes`, `teams`, `highlights`
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
