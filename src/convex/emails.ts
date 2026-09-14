/**
 * Email — transactional sends via the Resend REST API, called only from
 * scheduled internal functions. No key configured = a silent no-op, so the
 * product works perfectly in demo mode; paste RESEND_API_KEY and every
 * confirmation/receipt becomes a real email. (Same dormant-by-default
 * pattern as the Stripe integration.)
 *
 * This file runs in Node ("use node") because it calls fetch with auth.
 */
"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sender identity. Resend only lets you send from a domain you've verified,
 * so go-live is: verify your domain in Resend → Domains, then set EMAIL_FROM
 * (e.g. "Web Development with AI <receipts@yourdomain.com>"). Until then the
 * default onboarding@resend.dev address can only deliver to your own account
 * email — fine for testing receipts, not for real students.
 */
function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Web Development with AI <onboarding@resend.dev>";
}

export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // Demo mode: no key, no email — log instead of failing the schedule.
      console.info(`[email:noop] Would send to ${args.to}: ${args.subject}`);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [args.to],
        subject: args.subject,
        text: args.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed (${res.status}): ${body}`);
    }
  },
});

/**
 * Notify the course owner (you) about important events — new bookings and
 * purchases. Only sends when BOTH env vars exist: RESEND_API_KEY and
 * OWNER_EMAIL. Set OWNER_EMAIL in the Keys tab to start receiving them;
 * without it these are silent no-ops, never errors.
 */
export const notifyOwner = internalAction({
  args: {
    subject: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    const key = process.env.RESEND_API_KEY;
    const owner = process.env.OWNER_EMAIL;
    if (!key || !owner) return; // dormant by design

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [owner],
        subject: args.subject,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Owner notify failed (${res.status}): ${body}`);
    }
  },
});
