/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as bookings from "../bookings.js";
import type * as catalog from "../catalog.js";
import type * as emails from "../emails.js";
import type * as github from "../github.js";
import type * as githubCache from "../githubCache.js";
import type * as http from "../http.js";
import type * as insights from "../insights.js";
import type * as moduleContent from "../moduleContent.js";
import type * as moduleProgress from "../moduleProgress.js";
import type * as progress from "../progress.js";
import type * as rateLimit from "../rateLimit.js";
import type * as seed from "../seed.js";
import type * as showcase from "../showcase.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  bookings: typeof bookings;
  catalog: typeof catalog;
  emails: typeof emails;
  github: typeof github;
  githubCache: typeof githubCache;
  http: typeof http;
  insights: typeof insights;
  moduleContent: typeof moduleContent;
  moduleProgress: typeof moduleProgress;
  progress: typeof progress;
  rateLimit: typeof rateLimit;
  seed: typeof seed;
  showcase: typeof showcase;
  stripe: typeof stripe;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
