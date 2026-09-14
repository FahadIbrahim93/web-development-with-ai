/**
 * Pure shaping logic for the GitHub integration — no network, no React,
 * fully unit-testable. The Convex action fetches raw JSON from the GitHub
 * REST API; everything that turns that blob into trustworthy display data
 * lives here, so the risky edge (a changed or malformed API payload) is
 * covered by tests instead of hope.
 */

/** Repo shown when GITHUB_REPO is not configured (token-only activation). */
export const DEFAULT_GITHUB_REPO = "FahadIbrahim93/web-development-with-ai";

export type RepoSnapshot = {
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  /** Epoch ms of the last push. */
  pushedAt: number;
  latestReleaseTag?: string;
};

/**
 * Accepts "owner/repo" or a github.com URL and returns the normalized
 * "owner/repo" identifier the REST API expects, or null when the input
 * doesn't name a repository.
 */
export function parseRepoInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const path = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [owner, repo] = segments;
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return `${owner}/${repo}`;
}

/**
 * Human "x minutes/days ago" from an epoch-ms timestamp. Pure so display
 * is testable and identical on the landing widget and the admin card.
 */
export function timeAgo(epochMs: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - epochMs) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

function finiteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extract the display snapshot from a GitHub "Get a repository" payload.
 * Returns null for anything malformed — the caller then keeps serving the
 * last good snapshot rather than rendering garbage.
 */
export function shapeRepo(payload: unknown): RepoSnapshot | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  const fullName = p.full_name;
  if (typeof fullName !== "string" || !parseRepoInput(fullName)) return null;
  const stars = finiteNumber(p.stargazers_count);
  const forks = finiteNumber(p.forks_count);
  const openIssues = finiteNumber(p.open_issues_count);
  const pushedAtMs = Date.parse(
    typeof p.pushed_at === "string" ? p.pushed_at : "",
  );
  const defaultBranch = p.default_branch;
  if (stars === null || forks === null || openIssues === null) return null;
  if (!Number.isFinite(pushedAtMs)) return null;
  if (typeof defaultBranch !== "string" || defaultBranch === "") return null;
  return {
    repo: fullName,
    stars,
    forks,
    openIssues,
    defaultBranch,
    pushedAt: pushedAtMs,
  };
}
