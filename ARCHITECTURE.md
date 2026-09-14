# Architecture

How this project is built, and why. Written for reviewers, collaborators,
and future-you. For business context and the go-live runbook, see
[`docs/SHOWCASE.md`](docs/SHOWCASE.md).

## What this is

A full-stack course platform teaching non-technical people how websites
work and how to build one with AI. Version 1 ships one complete, free
15-minute lesson ("What is a website?") plus a catalog of paid modules,
bookings, showcase gallery, certificates, and an admin area.

## Stack at a glance

| Layer      | Choice                                   | Why it was chosen |
| ---------- | ---------------------------------------- | ----------------- |
| Frontend   | React 19 + Vite 7 + TypeScript (strict)  | Fast, type-safe SPA with route-level code splitting |
| Styling    | Tailwind CSS v4 + custom neobrutalism tokens | Square corners, hard borders, flat color blocks — the design system lives in `src/index.css` |
| Motion     | Framer Motion                            | Micro-interactions on games and section transitions |
| Backend    | Convex (functions + document DB)         | Reactive queries, typed end-to-end, zero server ops |
| Auth       | Convex Auth (email OTP)                  | Passwordless — the audience is non-technical |
| Payments   | Stripe (checkout + webhooks)             | Dormant until keys exist; the rest works without it |
| Email      | Resend (receipts) + platform OTP relay   | Dormant-until-configured pattern throughout |
| CI/CD      | GitHub Actions → Vercel (site), Convex CLI (functions) | Every push typechecked, linted, tested, built |
| Tests      | Vitest + Testing Library (jsdom)         | Unit tests on pure logic + interaction tests on the learning games |

## Directory map

```
src/
  main.tsx              App bootstrap: providers, router, error boundaries
  index.css             Design system: neobrutalism tokens + Tailwind v4 theme
  pages/                One file per route (all lazy-loaded)
  components/
    lesson/             Step-by-step lesson shell (Step1..Step5)
    interactive/        The learning games (quiz, checklist, prompt builder,
                        vibe switcher…) + their interaction tests
    ui/                 shadcn/ui primitives, restyled to the theme
  lib/                  Pure, testable logic (course rules, lesson metadata,
                        GitHub payload shaping)
  hooks/                Small shared hooks (page titles, etc.)
  convex/               Backend — see below
```

## Backend layout (`src/convex/`)

Convex files are grouped by domain. Each exports public functions
(client-callable) and internal helpers; access control is enforced inside
every function, never assumed from the route.

| File | Responsibility |
| ---- | -------------- |
| `schema.ts` | All tables + indexes. Single source of truth. |
| `auth.ts`, `auth.config.ts`, `http.ts` | Convex Auth wiring, email OTP provider |
| `users.ts` | Profiles, admin claim flow (first user by allow-list) |
| `progress.ts` | Free-lesson progress; validates `lessonId` against shared constant |
| `moduleProgress.ts` | Paid-module completion tracking |
| `moduleContent.ts` | Course/module/step content served to the player |
| `catalog.ts` | Catalog listing + detail (with free preview sections) |
| `bookings.ts` | 1:1 session scheduling |
| `stripe.ts` | Checkout session creation + webhook handling (dormant) |
| `emails.ts` | Resend receipts (dormant) |
| `waitlist.ts` | Early-access list |
| `showcase.ts` | Student site gallery |
| `insights.ts` | Aggregated admin metrics |
| `github.ts`, `githubCache.ts` | Repo health stats (admin-gated refresh → cached snapshot) |
| `rateLimit.ts` | Generic rate-limit helper used by sensitive endpoints |
| `admin.ts` | Admin-only queries (orders, bookings, waitlist) with indexed reads |
| `seed.ts` | One-shot content seeding |

**Scaling rule used throughout:** anything unbounded (per-user lists,
admin tables) reads through an index; admin name-lookups are O(1)
point-reads rather than whole-table scans. The documented next step for
large datasets is keyset pagination (`docs/SHOWCASE.md`).

## Request flow (a typical learner)

1. **Landing** (`/`) — marketing page; if a GitHub snapshot exists in the
   cache table, the "Built in the open" card renders. No API calls are
   made from visitors; only admins trigger refreshes.
2. **Auth** (`/auth`) — email OTP. Signed-in users keep the intended
   destination via `?returnTo=` (see `RequireAuth`).
3. **Dashboard** (`/dashboard`) — reactive Convex queries render progress;
   no local copy of server state.
4. **Lesson** (`/lesson`) and **Course player** (`/learn/:slug`) — each
   step composes an interactive game; solving it calls a progress
   mutation, which the dashboard subscription reflects instantly.
5. **Catalog → detail → checkout** (`/catalog`, `/catalog/:slug`,
   `/book/:slug`) — free preview sections render without purchase;
   paid modules go through Stripe checkout when configured.

## Frontend conventions

- **Routes are lazy chunks.** Each page loads on demand; the shared entry
  chunk carries only what every page needs. The preview toolbar (and its
  heavy screenshot dependency) is lazy so it never blocks first paint.
- **Server state stays server state.** Components subscribe with
  `useQuery` instead of duplicating data into `useState`/context.
- **Dormant-until-configured integrations.** Stripe, Resend, and GitHub
  widgets check for their env keys at runtime and hide themselves cleanly
  when absent — the demo works with zero external accounts.
- **Games share one contract.** Every interactive component accepts
  `onSolved` and fires it on the winning interaction; the lesson shell
  (not the game) decides what completion means.

## Testing strategy

- **Pure logic** (`src/lib/*.test.ts`): shaping, rules, metadata.
- **Interactions** (`src/components/interactive/interactive.test.tsx`):
  render the real games with Testing Library and assert the
  feedback/progress contract (correct, wrong, undo paths).
- Backend functions are exercised through types at build time; the CI
  pipeline runs codegen + `tsc` + ESLint + Vitest + a production build on
  every push.

## Environment variables

`GITHUB_TOKEN` / `GITHUB_REPO` power the repo-health widgets (see README).
`VITE_CONVEX_URL` and `CONVEX_SITE_URL` configure the app and auth. All
other integrations live behind Convex env vars set on the deployment —
never in source. `.env.example` lists the client-side surface.
