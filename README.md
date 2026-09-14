# Web Development with AI

[![CI](https://github.com/FahadIbrahim93/web-development-with-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/FahadIbrahim93/web-development-with-ai/actions/workflows/ci.yml)

An interactive course platform that teaches everyday people — shop owners,
freelancers, students, the curious — how to build a professional website for
themselves, with AI as their typing assistant. No coding background required.

Built as a real, sellable product: catalog + checkout + bookings + community
+ admin, all in one app.

**Design system:** Neobrutalism Minimalism — square corners, 2px black
borders, flat color blocking, hard offset shadows, bold but controlled
contrast, and a full dark developer-facing mode.

## What's inside

### For learners
- **Free interactive lesson** — a 4-step, click-through lesson that teaches
  what a website is, what it's made of, and where AI fits in. Ends with the
  learner building a small site themselves (vibe + color + words → live
  preview). Progress is saved locally and to the cloud when signed in.
- **Course player** — owned modules open a dedicated learning view with the
  full written curriculum: short lessons, plain-language explanations, and a
  hands-on exercise at the end of every section. Progress (done + solved
  challenges) lives in localStorage **and** in the database for signed-in
  learners, merged on load — so switching devices adds progress instead of
  losing it. The dashboard shows a per-module progress bar and percentage.
- **Interactive challenges in every section** — each of the 18 sections ends
  in a mini-game that must be solved before the section can be checked off:
  step-ordering puzzles, analogy matching, pick-the-best-prompt, form and
  shot-list editors (keep / cut), prompt assembly, launch checklists, and
  quick quizzes. Solving one triggers a confetti reward; wrong answers shake
  with honest explanations of why. Progress (done + solved) persists per
  user, and finishing a module earns a stamped completion card.
- **Learn-by-doing everywhere** — the free 4-step lesson keeps its original
  interactive demos (fake browser journey, hotspots, café builder), and the
  paid modules now teach the same way: every concept is followed by a thing
  to *do*, not just read.
- **Course catalog** — searchable, filterable modules with detail pages,
  one-time pricing, and free/paid tiers. Each detail page includes a "peek
  inside" preview: the real section titles with their hands-on challenges,
  so buyers can judge the teaching before paying.
- **Checkout** — real Stripe Checkout when keys are configured; a clearly
  labeled demo checkout (no money moves) when they aren't.
- **1:1 session booking** — pick a day, see live slot availability, confirm.
  The student's timezone is auto-detected, stored with the booking, shown in
  the admin Sessions tab, and included in the confirmation email.
- **Transactional email (Resend)** — booking confirmations and purchase
  receipts are sent through Resend's API. Without a `RESEND_API_KEY` the
  sends are silent no-ops (demo mode); paste the key and they become real
  emails. For production deliverability, verify your domain in Resend and
  update the `FROM` address in `src/convex/emails.ts`.
- **Student showcase** — submit your build for review, browse approved
  projects, and comment on classmates' work. Approved projects also appear
  automatically as social proof on the landing page.
- **Waitlist** — a pre-launch email capture on the landing page, stored in
  your own database (no third-party dependency). Counts are visible in the
  admin overview so you can gauge demand before promoting the course.
- **Printable certificate** — finishing the free lesson unlocks a branded,
  printable certificate (with a shareable link) — a motivator for students
  and free word-of-mouth for the course. For signed-in learners the
  certificate verifies real completion before it renders.
- **Mobile-first navigation** — a hamburger menu on phones, so every page is
  reachable on the devices most non-technical learners actually use.
- **Dashboard** — lesson progress, owned modules with one-click access to
  the course player, upcoming sessions, all in one place.

### For the course owner (admin area at `/admin`)
- Revenue, order, and waitlist overview
- **Insights tab** — free-lesson funnel (which of the 4 steps learners
  reach), per-module engagement (started / finished / bought), and headline
  totals. Computed live from your own data; the honest caveat about guest
  learners is printed right on the page.
- Full lesson CRUD: create, edit, publish/unpublish, delete modules
- Order log with buyer name + email (refund/support follow-ups)
- Session bookings with student name, email, private notes — and owner
  controls to cancel a session
- Waitlist viewer with one-click copy-all of collected emails
- Showcase moderation (approve/reject submissions)

## Tech stack
- **React 19 + Vite + TypeScript** — frontend
- **Tailwind CSS v4** with a custom **Neobrutalism Minimalism** design system
  (square corners, 2px borders, flat color blocks, hard offset shadows) and a
  full **dark developer-facing mode**
- **Convex** — database, auth (email OTP + guest), realtime queries,
  background-safe server functions
- **Stripe** — hosted checkout + signature-verified webhook fulfillment
- **Framer Motion** — tasteful motion where it aids comprehension

## Architecture & code map

A deep-dive version of this section — including the request flow for a
learner, backend access-control model, and the testing strategy — lives in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

```
src/
├── components/
│   ├── nb.tsx                    # Neobrutalism design-system primitives
│   │                             #   (NbSection, NbBox, NbButton, NbQuiz…)
│   ├── BrowserSim.tsx            # Fake-browser teaching widget (free lesson)
│   ├── SiteHeader.tsx            # Shared nav + dark-mode toggle + mobile menu
│   ├── interactive/              # 9 mini-games used across all courses
│   │   ├── games.tsx             #   ordering + analogy matching
│   │   ├── games2.tsx            #   pick-best, prompt builder, vibe switcher…
│   │   ├── NbChecklistGame.tsx   #   launch-day checklist
│   │   ├── NbSpotTheDifferenceGame.tsx
│   │   ├── NbConfetti.tsx        #   CSS-only confetti (zero deps)
│   │   └── SectionActivity.tsx   #   game dispatcher wiring solve→progress
│   └── lesson/                   # Free lesson: Steps 1–4
├── convex/                       # Backend (queries, mutations, actions)
│   ├── schema.ts                 #   users, lessons, orders, bookings,
│   │                             #   showcase, comments, waitlist, progress
│   ├── moduleContent.ts          #   6 modules × 3 sections of curriculum
│   │                             #   + per-section interactive challenge data
│   ├── catalog.ts / stripe.ts    #   purchase flow + webhook fulfillment
│   ├── bookings.ts / emails.ts   #   1:1 sessions + Resend transactional email
│   ├── github.ts / githubCache.ts#   repo stats (token-backed, cached snapshot)
│   ├── showcase.ts / admin.ts    #   community + owner tools
│   └── insights.ts               #   admin analytics (funnel + engagement)
├── pages/                        # Landing, Lesson, Catalog, CatalogItem,
│   # CoursePlayer, Book, Showcase, Certificate, Dashboard, Admin, Auth
├── hooks/                        # use-auth, use-nb-mode, use-page-title
└── lib/utils.ts                  # cn() and helpers
```

**Patterns worth noting**
- **Progress that survives devices** — local progress (per-user localStorage)
  is union-merged with server progress on load, so signing in adds history
  instead of overwriting it. Merge-safe writes on both ends.
- **Challenge-gated completion** — sections can't be marked done until their
  interactive challenge is solved, keeping the course learn-by-doing rather
  than read-and-click-next.
- **Graceful degradation everywhere** — missing Stripe/Resend keys fall back
  to labeled demo mode, never errors; the product is demoable with zero keys.
- **Dormant-by-default integrations** — paste env vars via the Keys UI and
  live payments/email activate with no code changes.
- **State discipline** — no setState-in-effect cascades; server data is merged
  via derived values and the React render-adjustment pattern.

### Known scaling limits (deliberate for v1)
Admin surfaces (`/admin`, insights) read full tables — orders, bookings,
waitlist, module progress — which is the right tradeoff while the whole
business fits on one screen. Buyer/student names are point-read per row (no
all-users scans), moderation and admin checks use dedicated indexes, and the
lesson-progress analytics read through an index. When a table grows past a
few thousand rows, move those admin queries to `usePaginatedQuery` with
cursor args, and pre-aggregate insights counters into a summary table —
both are contained, single-file changes by design.

## Running locally
```bash
bun install
bun convex dev --once   # generate backend types
bun tsc -b --noEmit     # typecheck
```
The platform runs the dev server automatically; never run `bun run dev`
manually in this environment.

## Going live with payments
1. Create a Stripe account and grab your keys.
2. Add these env vars via the project's Keys/API keys UI:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - (optional) `STRIPE_SITE_URL` — used for checkout redirects and the
     purchase-receipt link
   - (optional) `OWNER_EMAIL` — your email, enables owner notifications
3. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://<your-convex-domain>/stripe_webhook` listening for
   `checkout.session.completed`, and paste the signing secret as
   `STRIPE_WEBHOOK_SECRET`.

## Turning on real emails
1. Create a Resend account and grab an API key.
2. Add `RESEND_API_KEY` via the project's Keys/API keys UI.
3. (Required for real students) Verify your sending domain in Resend →
   Domains, then add `EMAIL_FROM` (e.g.
   `Web Development with AI <receipts@yourdomain.com>`). Without a verified
   domain, Resend can only deliver to your own account email — fine for
   testing, not for learners.

Booking confirmations and purchase receipts start flowing immediately —
no other code changes needed.

**Optional — get notified yourself:** add `OWNER_EMAIL` (your email
address) alongside the Resend key, and you'll also receive a short email
for every new booking and purchase. Without it, owner notifications stay
silent no-ops.

## Connecting GitHub (repo stats)
The landing page has a "Built in the open" section and the admin overview
has a repo-health card, both showing live stats for this project's public
repository. They stay hidden until the integration is configured:

1. Add `GITHUB_TOKEN` via the project's Keys/API keys UI — a GitHub
   personal access token (Settings → Developer settings → Tokens).
   Fine-grained, read-only, **no** repo scopes selected (public metadata
   only) is enough. This raises the API limit from 60 to 5,000 req/h.
2. Optionally add `GITHUB_REPO` as `owner/repo` (a full github.com URL
   also works). Without it, the integration tracks the project's default
   repo: `FahadIbrahim93/web-development-with-ai`.

Stats are fetched by an admin-gated action and cached as a single row —
public page reads never touch the GitHub API, so the landing page stays
fast and can never be rate-limited by visitor traffic. Refresh from the
admin overview card (or just open `/admin` and hit Refresh after pushing).

Until keys exist, checkout runs in demo mode: orders are created and marked
paid without charging anyone, so the whole flow is demo-able safely.

## Go-live verification checklist
Run these once, in test mode, before selling to real students:

1. **Payments end-to-end.** With Stripe test keys set, buy a module with
   card `4242 4242 4242 4242` (any future expiry, any CVC). Verify: hosted
   checkout opens → webhook marks the order paid (Stripe dashboard →
   Webhooks → attempts) → the module unlocks on return → receipt email
   arrives → the purchase shows in `/admin` → Orders.
2. **Emails.** Send one booking confirmation and one receipt to your own
   address, then to a non-account address once the domain is verified.
3. **Guardrails.** Confirm the demo-checkout banner is gone once real keys
   exist, and that a logged-out visitor hitting Buy is sent to sign-in and
   returned to the right module afterwards.
4. **First admin.** Visit `/admin`, click **Claim admin**, so ownership
   can't be taken by a stranger.

## GitHub repository

This repository is live at
[`FahadIbrahim93/web-development-with-ai`](https://github.com/FahadIbrahim93/web-development-with-ai).
The managed builder environment has no git binary, so the initial publish
was made through the GitHub REST API (blob → tree → commit → branch) — the
repo holds an authoritative snapshot, not granular history.

To work on it locally:

```bash
git clone https://github.com/FahadIbrahim93/web-development-with-ai.git
cd web-development-with-ai
bun install
bun convex dev --once      # generate backend types; prints your dev URL
cp .env.example .env.local # then fill VITE_CONVEX_URL from that output
bun run dev
```

From your clone, normal git takes over: commit, push, and CI runs on every
update to `main` (codegen → typecheck → lint → tests). Without the optional
`CONVEX_DEPLOY_KEY` repo secret, codegen is skipped and CI typechecks
against the committed `_generated` types — the badge goes green on the very
first run. To also sync the production backend on push, see
`.github/workflows/deploy-convex.yml` for the one-time secret setup.

Committed on purpose: `.env.example` (no values), `src/convex/_generated`
(CI typechecks against it — see `.gitignore`), `vercel.json`, and both
workflows. Never committed: any `.env*` with values.

## First-run notes
- The catalog self-seeds with 6 starter modules on first visit.
- The first person to visit `/admin` and click **Claim admin** becomes the
  course owner. Do this right after deploying so nobody else can.
