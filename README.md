# 🥕 Food on the Table

**Reduce food waste together.** Food on the Table helps households decide what to do with food before it spoils: cook it, eat it, share it with neighbours, donate it, or compost it. Every action adds to your personal impact score.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Status](https://img.shields.io/badge/status-prototype-orange)

> **Status:** early-stage prototype. See [Project status](#project-status) before you rely on it.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Security](#security)
- [Project status](#project-status)

---

## Features

| Area | Route | What you can do |
|---|---|---|
| 🏠 **Home & triage quiz** | `/` | Answer a few questions and get a recommendation: donate, share, eat soon, use now, be cautious, or compost. The home page also shows "Use this next" items that are about to expire, plus quick actions. |
| 🧊 **My Food** | `/my-food` | Track what's in your fridge, freezer and pantry. Add items by **barcode scan** (camera + [Open Food Facts](https://world.openfoodfacts.org/)) or with a manual form that pre-fills typical shelf life. Filter by storage or expiry, bulk-delete, freeze, or mark items as eaten. |
| 🤖 **AI food check** | `/my-food` | Ask the AI whether an item is safe to cook, eat, donate or discard, and why. |
| 🍳 **Recipe generator** | `/recipe-generator` | Drag expiring items into the *Cooking Pot*, pick cuisine, time, diet, meal type, flavour and method, and get a full recipe. You can print it, download it, or mark it as cooked. |
| 📍 **Donate** | `/donate` | A Google Maps view of nearby food banks, pantries, soup kitchens, shelters and community fridges, with a radius slider, filters, details (hours, phone, website) and directions. You can log a donation with a photo. |
| 🤝 **Community sharing** | `/community` | Post food you want to **offer** or **request**. Browse posts nearby, save or like them, and express interest. When the giver accepts, a chat opens automatically, and both sides confirm the pickup. |
| 💬 **Messages** | `/messages` | Real-time chat with unread counts, image attachments and muting. |
| 📚 **Learn** | `/learn`, `/my-collection` | Swipeable lessons and quizzes on food safety and sustainable living. You can like and save them. |
| 🌱 **Impact** | `/impact` | Points, levels (Seedling → Forest Guardian), meals saved, CO₂ avoided, money saved, badges, streaks and an opt-in leaderboard. |
| 🔔 **Notifications** | nav bell, `/settings` | Real-time alerts for interest, pickups and messages, with a toggle for each type. |
| 🔐 **Accounts** | `/auth` | Email/password or Google sign-in, with onboarding for username and zip code. |

## Tech stack

- **Frontend:** React 18, TypeScript, Vite 5, React Router 6
- **UI:** Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) (Radix UI), Framer Motion, Lucide icons, Recharts
- **Data:** TanStack Query, Supabase JS
- **Backend:** [Supabase](https://supabase.com/): Postgres with Row Level Security, Auth, Storage, Realtime and Edge Functions (Deno)
- **AI:** OpenAI `gpt-4o-mini`, called **only** from Supabase Edge Functions
- **Maps:** Google Maps JavaScript API + Places API
- **Barcode scanning:** ZXing + Open Food Facts

## Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser (React SPA)"]
    UI[Pages & components]
  end

  UI -- "supabase-js (anon key + user session)" --> SB[(Supabase<br/>Postgres + RLS, Auth,<br/>Storage, Realtime)]
  UI -- "functions.invoke" --> EF["Edge Functions<br/>openai-recipe / openai-evaluate"]
  EF -- "OPENAI_API_KEY (server secret)" --> OAI[OpenAI API]
  UI -- "Maps JS (browser key)" --> GM[Google Maps / Places]
  UI -- "POST /api/place-details" --> PD["api/place-details.ts<br/>(serverless / Vite dev proxy)"]
  PD -- "PLACE_DETAILS_API_KEY (server secret)" --> GP[Google Place Details]
  UI -- "barcode lookup" --> OFF[Open Food Facts]
```

- **Secrets never reach the browser.** The OpenAI key lives in Supabase Edge Function secrets. The Places server key is read by `api/place-details.ts`.
- `api/place-details.ts` is a standard `Request → Response` handler (Vercel-style `/api` folder). In development it is served by a small middleware in `vite.config.ts`.

## Getting started

### Prerequisites

- Node.js 18+ (20 LTS recommended) and npm
- A [Supabase](https://supabase.com/) project and the [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Google Cloud project with **Maps JavaScript API**, **Places API** and **Geocoding API** enabled
- An OpenAI API key (for the recipe and food-check features)

### 1. Clone and install

```sh
git clone https://github.com/vihuynh72/food-on-the-table.git
cd food-on-the-table
npm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

Fill in your own values. See [Environment variables](#environment-variables).

### 3. Set up the database

```sh
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

> ⚠️ The migration history is still being cleaned up. One version prefix is duplicated and some files may need reordering, so a fresh `db push` may need manual fixes. The `*.sql` files at the repo root are ad-hoc fix/diagnostic scripts from development. Treat `supabase/migrations/` as the source of truth.

In the Supabase dashboard, also:

- enable the **Google** auth provider (optional), and
- add `http://localhost:8080` and your production URL to **Auth → URL Configuration**.

### 4. Deploy the Edge Functions

```sh
supabase functions deploy openai-recipe
supabase functions deploy openai-evaluate
supabase secrets set OPENAI_API_KEY=<your-openai-key>
```

### 5. Run the app

```sh
npm run dev
```

The app runs at **http://localhost:8080**.

## Environment variables

| Variable | Where it's used | Public? | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | browser | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | yes | Supabase anon/publishable key. Public by design; RLS protects data |
| `VITE_GOOGLE_MAPS_API_KEY` | browser | yes | Maps JS / Places / Geocoding. **Restrict by HTTP referrer** |
| `PLACE_DETAILS_API_KEY` | server (`api/place-details.ts`, dev proxy) | **no** | Google Place Details. Use a separate, API-restricted key |
| `VITE_PLACE_DETAILS_ENDPOINT` | browser (optional) | yes | Override the details endpoint (default `/api/place-details`) |
| `OPENAI_API_KEY` | Supabase Edge Function secret | **no** | Set with `supabase secrets set`. **Never** put it in `.env` or give it a `VITE_` prefix |

> Anything prefixed with `VITE_` is baked into the JavaScript bundle and visible to every visitor.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on port 8080 (includes the `/api/place-details` proxy) |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
├── api/
│   └── place-details.ts        # Serverless proxy for Google Place Details
├── public/                     # Static assets (favicons, robots.txt)
├── src/
│   ├── pages/                  # Route components (MyFood, Donate, Community, Learn, …)
│   ├── components/
│   │   ├── food/               # Inventory, barcode scanner, cooking pot
│   │   ├── donation/           # Donation map, search, details sheet
│   │   ├── community/          # Posts, filters, interest & pickup flows
│   │   ├── chat/               # Conversations and messages
│   │   ├── learn/              # Lesson reels and quizzes
│   │   └── ui/                 # shadcn/ui primitives + custom UI
│   ├── contexts/               # Auth/session context
│   ├── hooks/                  # Data hooks (TanStack Query + Supabase)
│   ├── lib/                    # OpenAI client, Maps loader, impact scoring, utils
│   ├── integrations/supabase/  # Supabase client + generated types
│   └── data/                   # Food shelf-life knowledge base
└── supabase/
    ├── migrations/             # Database schema, RLS policies, RPCs, seed content
    └── functions/              # Edge Functions (openai-recipe, openai-evaluate)
```

## Security

- **Never commit `.env`.** It is git-ignored. Use `.env.example` as the template.
- Keep `OPENAI_API_KEY` and `PLACE_DETAILS_API_KEY` server-side only.
- Restrict Google API keys: HTTP referrer plus API restrictions for the browser key, API restrictions for the server key. Set quotas and budget alerts.
- The Supabase anon key is public by design. **Row Level Security policies are what protect user data**, so review them before deploying.
- Found a vulnerability? Please report it privately through GitHub's **Security → Report a vulnerability** tab instead of opening a public issue.

## Project status

This is a prototype, originally scaffolded with [Lovable](https://lovable.dev/) and developed further by hand. Known gaps:

- No automated tests or CI yet
- ESLint reports outstanding issues (mostly `any` types), and the generated Supabase types are out of date
- Migrations need consolidation (see the note in [step 3](#3-set-up-the-database))
- Some unused or duplicate components and pages remain from earlier iterations
- Impact points are currently calculated client-side

Contributions and issues are welcome.
