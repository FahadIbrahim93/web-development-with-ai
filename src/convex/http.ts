import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { stripeWebhook } from "./stripe";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe sends checkout events here (signature-verified).
http.route({
  path: "/stripe_webhook",
  method: "POST",
  handler: stripeWebhook,
});

export default http;
