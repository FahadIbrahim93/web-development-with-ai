# Portfolio Showcase Kit

Everything needed to put this project on fahadibrahim93.github.io properly.
Do the steps in order — deployment first, assets second, paste last.

---

## 1. Positioning (why this card leads)

This is the only project in the portfolio with a **complete business loop**:

| Surface | Where else it appears in your portfolio |
|---|---|
| Payments (Stripe checkout + webhook fulfillment) | **nowhere** — this is the first |
| Admin area: orders, bookings, analytics, moderation | **nowhere** |
| Email automation (receipts, confirmations, owner alerts) | **nowhere** |
| Reactive backend with end-to-end types (Convex) | new vs. Supabase/Firebase |
| Auth-gated paid content (entitlement enforcement) | **nowhere** |
| Unit tests + CI on every push | BugSmasher (tests only) |

Recommended placement: **first card**. JG Mart proves you ship for real
communities; this proves you can build the whole product an owner can run.

---

## 2. Deploy runbook (~30 minutes, one-time)

Two deployables: a Convex production backend and a static frontend.
Repo is already deploy-ready: `convex.json` points functions at
`src/convex/`, and `vercel.json` handles SPA rewrites, asset caching,
and security headers — so both platforms need zero manual config.

**Backend — Convex prod (first time)**
```bash
bunx convex deploy --prod --create   # creates the production deployment
```
Then in the Convex dashboard → Settings → Environment Variables:

1. **Auth (required, not optional):** the dev deployment's auth keys are
   platform-provisioned. Copy `JWT_PRIVATE_KEY`, `JWKS`, and
   `VLY_CONVEX_AUTH_ISSUER` from the dev deployment's env list into prod,
   and set `CONVEX_SITE_URL` to the prod site URL
   (`https://<prod-slug>.convex.site`). Without these, sign-in loops back
   to /auth on prod.
   Also copy `VLY_EMAIL_API_KEY` from the dev deployment's env list —
   the OTP email relay authenticates with it; without it, sign-in codes
   never arrive on prod.
2. **Capabilities (each optional, test after each):**
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
   `EMAIL_FROM`, `OWNER_EMAIL`, `STRIPE_SITE_URL` — see README "Going
   live" sections. Demo mode runs fine with none of them.

**Frontend — Vercel**
1. Import the GitHub repo — `vercel.json` supplies build + routing.
2. Environment variable: `VITE_CONVEX_URL` = the prod Convex URL.
3. First build ships; every push to main redeploys automatically.

**Backend sync after the first deploy** — `.github/workflows/deploy-convex.yml`
keeps prod functions in sync on every push. Enable it once:
`bunx convex deploy --prod --create-key`, add the key as the repo secret
`CONVEX_DEPLOY_KEY`. Until then the workflow skips itself harmlessly.

**Stripe webhook** — dashboard → Webhooks → endpoint
`https://<your-prod-slug>.convex.site/stripe_webhook`, event
`checkout.session.completed`. Then run the README's "Go-live verification
checklist" (test card 4242… end-to-end).

**First-run** — visit `/admin`, click **Claim admin** immediately.

---

## 3. Card copy (paste-ready)

Match your existing card markup — the content is what matters.

- **Badge:** `● Live`
- **Title:** 🎓 Web Development with AI
- **Description:**
  > Interactive course platform that teaches non-technical people to build
  > professional websites with AI — read a little, do a challenge, move on.
  > Full SaaS loop: email-OTP auth, Stripe checkout with webhook fulfillment,
  > 1:1 session booking, admin analytics, and transactional email. Every
  > module gates on a hands-on challenge you must solve to progress.
- **Tags:** `React 19` · `TypeScript` · `Convex` · `Stripe` · `Vitest + CI`
- **Links:** `→ Try lesson 1 free` (live demo) · `→ GitHub` (repo)
- **Honesty line (your style):** "Payments verified end-to-end in Stripe
  test mode" — swap to "live" only after the checklist passes for real.

---

## 4. Demo asset (the 40 seconds that sell it)

Static screenshots undersell this project — the product is *interactive*.
Record one 40-second clip (Cap, ScreenToGif, or Loom → GIF):

1. (0–8s) Landing hero → click into the free lesson.
2. (8–20s) Solve one interactive challenge — order game snapping into place.
3. (20–28s) Confetti + completion screen.
4. (28–35s) Catalog: the green **Completed** badge appears with no refresh.
5. (35–40s) Admin area: insights/funnel view.

Embed it at the top of the card (or README). Your other cards are
text-only — this alone differentiates the project on the page.

---

## 5. Interview talking points (defensible depth)

Each of these is a real decision in the codebase you can whiteboard:

1. **Why Convex over Supabase here.** Reactive queries are subscriptions —
   the catalog badge appears the instant a module is finished, with zero
   cache-invalidation code. End-to-end types from schema to UI.
2. **Double-booking prevention.** A `bookingLocks` row per (date, time);
   concurrent mutations contend on the same document and Convex OCC
   serializes them — the loser sees the lock and fails gracefully.
3. **Webhook fulfillment is server-only and idempotent.** Prices come from
   the DB, never the client; `markOrderPaidById` no-ops if already paid.
4. **One completion rule, four consumers.** `src/lib/courseRules.ts` —
   catalog badges, player finish screen, dashboard %, and admin insights
   all call the same tested pure function. Drift is impossible.
5. **The test that caught a real bug.** `"2026-02-31"` silently rolled over
   to March 3rd in date validation — the Vitest suite exposed it and the
   validator now rejects impossible dates outright.

---

## 6. Portfolio-site follow-ups

- Add `Convex` and `Stripe` to the subtitle tag line
  ("React, TypeScript, Supabase" → include the new stack once live).
- Mirror the card in the `FahadIbrahim93` profile README.
- Pin the repo on GitHub (it's the only pinned-worthy full-SaaS repo).
