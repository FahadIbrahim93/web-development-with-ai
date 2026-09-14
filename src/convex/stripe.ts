/**
 * Stripe checkout + webhook fulfillment.
 *
 * - If STRIPE_SECRET_KEY is set, startCheckoutAction creates a real Stripe
 *   Checkout Session and returns its hosted URL.
 * - If not, the app falls back to demo checkout automatically (no code paths
 *   to flip). Orders created for Stripe carry the session id so the webhook
 *   can mark them paid.
 *
 * Keys are read from process.env at runtime. Add them via the project's
 * Keys / API keys UI; no code changes are needed to go live.
 */
import Stripe from "stripe";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const startCheckoutAction = action({
  args: {
    slug: v.string(),
    orderId: v.id("orders"),
    origin: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    if (!stripe) return { mode: "demo" as const, url: null };

    const order = await ctx.runQuery(api.catalog.getOrder, {
      orderId: args.orderId,
    });
    if (!order) throw new Error("Order not found.");
    const lesson = await ctx.runQuery(api.catalog.getLesson, {
      slug: args.slug,
    });
    if (!lesson) throw new Error("Lesson not found.");

    const siteUrl = process.env.STRIPE_SITE_URL ?? args.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: lesson.priceCents,
            product_data: {
              name: lesson.title,
              description: lesson.tagline,
            },
          },
        },
      ],
      success_url: `${siteUrl}/catalog/${lesson.slug}?checkout=success`,
      cancel_url: `${siteUrl}/catalog/${lesson.slug}?checkout=cancelled`,
      metadata: { orderId: args.orderId, lessonSlug: lesson.slug },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    await ctx.runMutation(api.catalog.attachStripeSession, {
      orderId: args.orderId,
      sessionId: session.id,
    });

    return { mode: "stripe" as const, url: session.url };
  },
});

/**
 * Stripe webhook. Configure the endpoint at
 * <convex-site-url>/stripe_webhook with event
 * checkout.session.completed. Signature verification uses
 * STRIPE_WEBHOOK_SECRET.
 */
export const stripeWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();
  if (!stripe || !secret) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await ctx.runMutation(internal.catalog.markOrderPaidById, {
        orderId: orderId as Id<"orders">,
        sessionId: session.id,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
