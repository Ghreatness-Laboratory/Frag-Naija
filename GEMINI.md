# GEMINI.md

## Project Overview

**Frag Naija** is a Nigeria-focused esports media and engagement platform. It's designed to be a "tactical command center" for the local competitive gaming scene, allowing fans to:
- Discover and rank elite players (Athletes).
- Explore tactical squads (Teams).
- Follow national circuits and championships (Tournaments).
- Watch match replays and clutch moments (Highlights).
- Monitor player movements and market activity (Transfer Window).
- Participate in prediction-style markets (Wager Zone).
- Withdraw winnings to Nigerian bank accounts (Automated Withdrawals).

The application is in a hybrid state: the backend (Supabase + REST APIs) is live, but some frontend pages still use seeded data from `src/lib/data.ts`.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Wallets)
- **Payments**: Paystack (Wagers)
- **Language Mix**: TypeScript for UI (`.tsx`), JavaScript for server-side logic (`.js`)

## Architecture & Project Structure

The project follows a feature-based architecture for the backend:

- `src/app/`: Next.js App Router (pages and API routes).
  - `api/`: Public and Admin REST API route handlers.
- `src/features/`: Feature-based backend modules containing business logic.
  - `athletes/`, `teams/`, `tournaments/`, `transfers/`, `highlights/`, `wagers/`, `auth/`.
  - `shared/server/`: Shared server-side logic (Supabase admin client, session management).
- `src/components/`: Reusable React components and layout pieces (`Navbar`, `Sidebar`, `Footer`).
- `src/lib/`: Frontend-specific libraries and utilities.
  - `hooks.js`: Custom React hooks for data fetching from the live API.
  - `data.ts`: Seeded/mock data used by some pages.
  - `paystack.js`: Paystack integration helpers.
- `supabase/`: SQL schema for bootstrapping the database.
- `middleware.js`: Protects `/admin/*` routes using cookie-based session verification.

## Building and Running

### Prerequisites
- Node.js installed.
- A Supabase project with `supabase/schema.sql` applied.
- Storage buckets: `athletes`, `teams`, `highlights`.
- Paystack account (for wagers).

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env.local` file with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only)
- `PAYSTACK_SECRET_KEY`
- `ADMIN_PASSWORD` (For admin auth)
- `NEXT_PUBLIC_SITE_URL`

### Commands
- `npm run dev`: Start the development server.
- `npm run build`: Build for production.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint checks.

## Development Conventions

1.  **Backend Logic**: All business logic and database interactions should live in `src/features/`. API routes in `src/app/api/` should be thin wrappers that call feature functions.
2.  **Authentication**:
    -   **User Auth**: Managed via Supabase email/password. Token stored in `sb-access-token` cookie.
    -   **Admin Auth**: Managed via a custom HMAC-signed session in the `admin_auth` cookie. Password set via `ADMIN_PASSWORD` env.
3.  **Data Fetching**: Use the custom hooks in `src/lib/hooks.js` for frontend data fetching. Migrate existing pages from `src/lib/data.ts` to these hooks.
4.  **Admin Protection**: Guard admin routes using the `middleware.js` and server-side `checkAdmin()` utility.
5.  **Styling**: Use Tailwind CSS for all styling. Maintain the "tactical command center" aesthetic (monochrome/green accents, technical fonts).
6.  **File Naming**: UI components use `.tsx`, while server-side business logic and API routes typically use `.js`.
