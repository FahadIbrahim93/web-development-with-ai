/**
 * GitHub — live repo stats for the "Built in the open" landing widget and
 * the admin repo-health card, via the GitHub REST API.
 *
 * Dormant-by-default (same pattern as the Stripe/Email integrations):
 * with no GITHUB_REPO and no GITHUB_TOKEN configured, nothing fetches and
 * every surface hides itself. Add GITHUB_TOKEN in the Keys tab and the
 * widget appears; public repos also work without a token when GITHUB_REPO
 * is set explicitly, but the token raises the rate limit from 60 req/h to
 * 5,000 req/h and authenticates the calls.
 *
 * Reads never touch the network: the landing widget subscribes to a single
 * cached snapshot row that only admin-gated actions refresh. Runs in Node
 * ("use node") because it calls fetch with auth headers.
 */
"use node";

import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DEFAULT_GITHUB_REPO, shapeRepo } from "../lib/githubShape";

const API_BASE = "https://api.github.com";
/** Skip the network entirely if the cached snapshot is younger than this. */
const MIN_REFRESH_INTERVAL_MS = 30_000;

function githubHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Which repo to track and whether the integration is active at all. */
function resolveTarget(): { repo: string; token?: string } | null {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (repo) return { repo: repo.trim(), token };
  if (token) return { repo: DEFAULT_GITHUB_REPO, token };
  return null; // dormant by design
}

/**
 * Fetch fresh stats and update the cache. Admin-only (every fetch is an
 * outbound API call, so the write surface must not be public). The client
 * calls this from the admin card; it also self-refreshes when the owner
 * opens the admin area with stale data.
 */
export const refreshNow = action({
  args: {},
  handler: async (ctx) => {
    // Actions have no direct db access — auth and cache reads go through
    // runQuery (nested calls inherit the caller's identity).
    const role = await ctx.runQuery(api.admin.getMyRole, {});
    if (!role.isAdmin) throw new Error("Admins only.");

    const target = resolveTarget();
    if (!target) {
      return {
        status: "unconfigured" as const,
        message:
          "Set GITHUB_TOKEN (and optionally GITHUB_REPO) in the Keys tab to activate.",
      };
    }

    const existing = await ctx.runQuery(internal.githubCache.getSnapshot, {});
    if (
      existing &&
      Date.now() - existing.fetchedAt < MIN_REFRESH_INTERVAL_MS
    ) {
      return { status: "ok" as const, message: "Already up to date." };
    }

    let repoRes: Response;
    try {
      repoRes = await fetch(`${API_BASE}/repos/${target.repo}`, {
        headers: githubHeaders(target.token),
      });
    } catch (e) {
      return {
        status: "error" as const,
        message: `Network error reaching GitHub: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
    if (!repoRes.ok) {
      return {
        status: "error" as const,
        message: `GitHub API error ${repoRes.status} for ${target.repo}${
          repoRes.status === 404
            ? " — does the repo exist and is it accessible?"
            : ""
        }`,
      };
    }
    const shaped = shapeRepo(await repoRes.json());
    if (!shaped) {
      return {
        status: "error" as const,
        message: "Unexpected payload from GitHub — kept the last snapshot.",
      };
    }

    // Latest release tag is a nice-to-have; a repo with no releases 404s.
    let latestReleaseTag: string | undefined;
    try {
      const relRes = await fetch(
        `${API_BASE}/repos/${target.repo}/releases/latest`,
        { headers: githubHeaders(target.token) },
      );
      if (relRes.ok) {
        const rel = (await relRes.json()) as { tag_name?: unknown };
        if (typeof rel.tag_name === "string") latestReleaseTag = rel.tag_name;
      }
    } catch {
      // Cosmetic field — ignore failures.
    }

    await ctx.runMutation(internal.githubCache.store, {
      repo: shaped.repo,
      stars: shaped.stars,
      forks: shaped.forks,
      openIssues: shaped.openIssues,
      defaultBranch: shaped.defaultBranch,
      pushedAt: shaped.pushedAt,
      latestReleaseTag,
    });
    return { status: "ok" as const, message: "Snapshot refreshed." };
  },
});
