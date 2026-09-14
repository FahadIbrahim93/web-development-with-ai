/**
 * Tests for the pure GitHub-shaping logic. The risky edge of the
 * integration is a changed or malformed GitHub API payload — these tests
 * pin exactly what we accept and what we reject, so a surprise payload
 * degrades to "keep the last snapshot" instead of rendering garbage.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GITHUB_REPO,
  parseRepoInput,
  shapeRepo,
  timeAgo,
} from "./githubShape";

describe("parseRepoInput", () => {
  it("accepts owner/repo shorthand", () => {
    expect(parseRepoInput("octocat/hello-world")).toBe(
      "octocat/hello-world",
    );
  });

  it("accepts full https URLs, trailing slashes, and www", () => {
    expect(parseRepoInput("https://github.com/octocat/hello-world")).toBe(
      "octocat/hello-world",
    );
    expect(parseRepoInput("https://www.github.com/octocat/hello-world/")).toBe(
      "octocat/hello-world",
    );
  });

  it("accepts repo names with dots, dashes, and underscores", () => {
    expect(parseRepoInput("my.org/my_repo-2")).toBe("my.org/my_repo-2");
  });

  it("rejects empty, single-segment, and malformed input", () => {
    expect(parseRepoInput("")).toBeNull();
    expect(parseRepoInput("   ")).toBeNull();
    expect(parseRepoInput("just-a-name")).toBeNull();
    expect(parseRepoInput("bad owner/repo")).toBeNull();
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-09-11T12:00:00Z");
  it("buckets sub-minute, hours, days, and years", () => {
    expect(timeAgo(now - 30_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5 minutes ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3 hours ago");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("2 days ago");
    expect(timeAgo(now - 400 * 86_400_000, now)).toBe("1 year ago");
  });
  it("uses singular for exactly one unit", () => {
    expect(timeAgo(now - 60_000, now)).toBe("1 minute ago");
    expect(timeAgo(now - 86_400_000, now)).toBe("1 day ago");
  });
  it("never reports negative time from clock skew", () => {
    expect(timeAgo(now + 60_000, now)).toBe("just now");
  });
});

describe("shapeRepo", () => {
  const good = {
    full_name: "octocat/hello-world",
    stargazers_count: 42,
    forks_count: 7,
    open_issues_count: 3,
    pushed_at: "2026-09-01T12:00:00Z",
    default_branch: "main",
  };

  it("extracts the display snapshot from a well-formed payload", () => {
    const shaped = shapeRepo(good);
    expect(shaped).not.toBeNull();
    expect(shaped!.repo).toBe("octocat/hello-world");
    expect(shaped!.stars).toBe(42);
    expect(shaped!.forks).toBe(7);
    expect(shaped!.openIssues).toBe(3);
    expect(shaped!.defaultBranch).toBe("main");
    expect(shaped!.pushedAt).toBe(Date.parse("2026-09-01T12:00:00Z"));
  });

  it("rejects null and non-object payloads", () => {
    expect(shapeRepo(null)).toBeNull();
    expect(shapeRepo("nope")).toBeNull();
    expect(shapeRepo(42)).toBeNull();
  });

  it("rejects payloads missing counts or branch", () => {
    expect(shapeRepo({ ...good, stargazers_count: undefined })).toBeNull();
    expect(shapeRepo({ ...good, forks_count: "many" })).toBeNull();
    expect(shapeRepo({ ...good, default_branch: "" })).toBeNull();
    expect(shapeRepo({ ...good, default_branch: 7 })).toBeNull();
  });

  it("rejects unparseable or missing pushed_at dates", () => {
    expect(shapeRepo({ ...good, pushed_at: "not-a-date" })).toBeNull();
    expect(shapeRepo({ ...good, pushed_at: 1234 })).toBeNull();
  });

  it("rejects a full_name that is not a repo identifier", () => {
    expect(shapeRepo({ ...good, full_name: "just-a-name" })).toBeNull();
  });

  it("tolerates extra unknown fields", () => {
    expect(shapeRepo({ ...good, id: 1, private: false, owner: {} })).not.toBeNull();
  });

  it("exposes the default repo for token-only activation", () => {
    expect(DEFAULT_GITHUB_REPO).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });
});
