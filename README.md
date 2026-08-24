# Richie Koh — Portfolio

Full-stack portfolio built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.
Case studies, an MDX blog, a rigged 3D avatar, and a calendar booking system backed by
Google Calendar.

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. **No environment variables are required** — the booking flow
falls back to demo availability and an in-memory store so the site is fully explorable
on a fresh clone. Each secret you add later upgrades one slice in place.

---

## Architecture

The booking feature is built as a **hexagonal (ports-and-adapters)** domain, which is
why it can run with or without credentials and why the scheduling rules are testable
without a network.

```
src/
├── core/booking/              framework-free domain — no React, no Next, no I/O
│   ├── domain/                Duration · TimeSlot · Attendee · Booking · errors
│   ├── ports/                 the interfaces the domain depends on
│   ├── services/              AvailabilityService · BookingService
│   └── config/                SchedulingPolicy (hours, notice, horizon, buffers)
│
├── infrastructure/            concrete adapters that satisfy those ports
│   ├── calendar/              GoogleCalendarAdapter │ DemoCalendarAdapter
│   ├── persistence/           NeonBookingRepository │ InMemoryBookingRepository
│   ├── notify/                ResendNotifier        │ ConsoleNotifier
│   ├── security/              rate limiting
│   └── Container.ts           composition root — picks real vs. fallback
│
├── content/                   all site copy as typed modules + MDX posts
├── components/
│   ├── ui/                    shadcn primitives
│   ├── react-bits/            React Bits registry components
│   ├── booking/               the three-step booking wizard
│   ├── three/                 3D avatar canvas + clip switcher
│   ├── sections/              home page sections
│   ├── layout/                header, footer, cursor, scroll progress
│   └── work/ blog/ common/
└── app/                       routes + API handlers
```

**The rule:** `core/` never imports from `infrastructure/` or `components/`. Dependencies
point inward. `Container.ts` is the only place that knows which adapter is real.

### Why the fallbacks exist

`Container.resolve()` picks a real adapter when its credentials are present and a safe
one when they are not:

| Port | With credentials | Without |
| --- | --- | --- |
| Calendar | `GoogleCalendarAdapter` — real free/busy, real invites | `DemoCalendarAdapter` — deterministic fake busy blocks |
| Repository | `NeonBookingRepository` — Postgres | `InMemoryBookingRepository` — per-process |
| Notifier | `ResendNotifier` — branded email | `ConsoleNotifier` — logs |

Visit **`/api/health`** to see which resolved, plus a hint for each one still missing.

---

## Enabling real bookings

### 1. Google Calendar

A plain API key cannot read a private calendar's free/busy, and a service account cannot
send invites from a consumer Gmail address. So this uses OAuth2 with a long-lived refresh
token for your own account.

1. **Google Cloud Console** → new project → enable the **Google Calendar API**
2. **APIs & Services → OAuth consent screen** → External → add yourself as a test user
3. **Credentials → Create OAuth client ID → Web application**
   Authorised redirect URI: `http://localhost:5813/oauth2callback`
4. Put the client ID and secret in `.env.local`
5. Run the helper — it opens a consent flow and captures the token for you:

```bash
npm run auth:google
```

6. Copy the printed `GOOGLE_REFRESH_TOKEN` into `.env.local` **and** into Vercel

> Only free/busy is ever read. Event titles, guests, and descriptions on your calendar
> are never fetched, so nothing private can surface in the UI.

### 2. Database (Neon)

```bash
# Create a free project at neon.tech, copy the pooled connection string
echo 'DATABASE_URL=postgresql://...' >> .env.local
npm run db:migrate
```

### 3. Email (optional)

Google already emails the invite. Resend adds a branded confirmation on top:

```bash
RESEND_API_KEY=re_...
RESEND_FROM=Richie Koh <bookings@yourdomain.com>
BOOKING_OWNER_EMAIL=your@email.com
```

---

## Scheduling rules

All tunable from the environment — no redeploy of code needed, just a settings change:

| Variable | Default | Meaning |
| --- | --- | --- |
| `BOOKING_TIMEZONE` | `Asia/Singapore` | Zone the working hours are expressed in |
| `BOOKING_WORKING_DAYS` | `1,2,3,4,5` | Mon = 1 … Sun = 7 |
| `BOOKING_HOURS` | `09:00-12:30,14:00-18:30` | Local windows, comma separated |
| `BOOKING_SLOT_INTERVAL` | `30` | Grid granularity in minutes |
| `BOOKING_MIN_NOTICE_MINUTES` | `120` | How far ahead a booking must be |
| `BOOKING_HORIZON_DAYS` | `60` | How far out the calendar opens |
| `BOOKING_BUFFER_MINUTES` | `0` | Gap enforced either side of a commitment |
| `BOOKING_MAX_PER_DAY` | `4` | Cap on sessions per day |

Session lengths (15/30/45/60) are a domain invariant, not config — see `Duration.ts`.

---

## The 3D avatar

The raw export was 17 MB, dominated by three 4096×4096 textures (one a 12 MB PNG) costing
~268 MB of VRAM. `npm run avatar:optimize` downsamples per texture slot and re-encodes to
WebP:

| | Before | After |
| --- | --- | --- |
| File size | 16.36 MB | **1.24 MB** (−92.4%) |
| Animation clips | 7 | 7 |

The seven clips are labelled in `src/components/three/avatarClips.ts` — the raw names are
`NlaTrack`…`NlaTrack.006`, so the friendly labels (Idle, Wave, Greet, Talk, Cheer, Sway,
Dance) were assigned by measuring per-limb angular travel in each clip. **To rename one,
edit `label` in that file** — nothing else reads the raw track names.

The canvas only mounts once it scrolls into view, and falls back to a message if WebGL is
unavailable.

---

## Editing content

Nothing user-facing is hard-coded in a component.

| What | Where |
| --- | --- |
| Name, bio, socials, stats | `src/content/profile.ts` |
| Case studies | `src/content/projects.ts` |
| Skills, experience, achievements, testimonials | `src/content/resume.ts` |
| `/uses` page | `src/content/uses.ts` |
| Navigation | `src/content/navigation.ts` |
| Blog posts | `src/content/blog/*.mdx` |

A new post is just a new `.mdx` file with frontmatter:

```mdx
---
title: Something I learned
description: One sentence for the card and the share preview.
date: 2026-09-01
tags: [typescript, performance]
draft: false
---
```

Drafts render in development and are hidden in production.

---

## Component registries

Configured in `components.json`, credentials in `.env.local`. Install with:

```bash
npx shadcn@latest add @reactbits-starter/<name>
```

Browse the full React Bits catalogue (271 items):

```bash
curl -H "Authorization: Bearer $REACTBITS_LICENSE_KEY" \
  https://proxy.collectui.pro/api/r/reactbits/starter/registry.json
```

---

## Commands

```bash
npm run dev              # dev server
npm run build            # production build
npm run check            # typecheck + lint
npm run db:migrate       # apply migrations
npm run auth:google      # capture a Google refresh token
npm run avatar:optimize  # re-compress the GLB from avatar-raw.glb
npm run shots <dir> /    # screenshot pages at desktop + mobile
```

---

## Deployment

Deployed on Vercel. Push to `main` to ship; pull requests get preview deploys.

Add the environment variables in **Project → Settings → Environment Variables**, then
redeploy and check `/api/health` to confirm each adapter went live.
