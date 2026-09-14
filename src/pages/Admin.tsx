/**
 * Admin — everything the course owner manages: stats, lesson catalog CRUD,
 * orders, and showcase moderation. Guarded client-side by isAdmin.
 */
import { useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BookLock,
  CalendarClock,
  Copy,
  LayoutDashboard,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/SiteHeader";
import { NbBox, NbButton, NbSection, NbTag } from "@/components/nb";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { timeAgo } from "@/lib/githubShape";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

/** Shape of the lesson editor form (topics is a comma-separated string). */
type LessonDraft = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: (typeof LEVELS)[number];
  priceCents: number;
  isFree: boolean;
  isPublished: boolean;
  minutes: number;
  topics: string;
  order: number;
};

export default function Admin() {
  usePageTitle("Admin");
  const { isAuthenticated } = useAuth();
  const role = useQuery(api.admin.getMyRole, {});
  const pending = useQuery(api.admin.listPendingPosts, {});
  const orders = useQuery(api.admin.listAllOrders, {});
  const lessons = useQuery(api.admin.listAllLessons, {});
  const bookings = useQuery(api.bookings.listAllBookingsWithUsers, {});
  const waitlist = useQuery(api.waitlist.listWaitlist, {});
  const insights = useQuery(api.insights.getInsights, {});
  const moderate = useMutation(api.admin.moderatePost);
  const claimAdmin = useMutation(api.admin.claimAdmin);
  const upsertLesson = useMutation(api.admin.upsertLesson);
  const deleteLesson = useMutation(api.admin.deleteLesson);
  const publishLesson = useMutation(api.admin.publishLesson);
  const updateBookingStatus = useMutation(api.admin.updateBookingStatus);
  const refreshRepo = useAction(api.github.refreshNow);
  const repo = useQuery(api.githubCache.repoSnapshot, {});

  const [tab, setTab] = useState<
    | "overview"
    | "insights"
    | "lessons"
    | "orders"
    | "sessions"
    | "moderation"
    | "waitlist"
  >("overview");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<
    | (LessonDraft & { id?: Id<"lessons"> })
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [repoMsg, setRepoMsg] = useState<string | null>(null);

  const paidRevenue = (orders ?? [])
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amountCents, 0);

  if (!isAuthenticated || (role !== undefined && !role.isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="/admin" />
        <NbSection className="py-20">
          <NbBox className="nb-shadow-lg mx-auto max-w-md bg-card p-8 text-center">
            <ShieldCheck className="mx-auto size-10" />
            <h1 className="mt-3 text-2xl font-bold uppercase">Admin area</h1>
            {role !== undefined && !role.isAdmin && (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  This account isn't an admin yet. If you're the course owner
                  and no admin exists, you can claim it once.
                </p>
                <NbButton
                  className="mt-4"
                  onClick={async () => {
                    setError(null);
                    try {
                      await claimAdmin({});
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed.");
                    }
                  }}
                >
                  Claim admin (first time only)
                </NbButton>
              </>
            )}
            {role === undefined && (
              <p className="mt-2 text-sm text-muted-foreground">Checking access…</p>
            )}
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </NbBox>
        </NbSection>
      </div>
    );
  }

  const revenue = `$${(paidRevenue / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/admin" />
      <NbSection className="py-10">
        <NbTag className="bg-[var(--chart-3)]">Admin</NbTag>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">
          Manage your course
        </h1>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview", LayoutDashboard],
              ["insights", "Insights", BarChart3],
              ["lessons", "Lessons", BookLock],
              ["orders", "Orders", BadgeDollarSign],
              ["sessions", "Sessions", CalendarClock],
              ["moderation", "Moderation", Users],
              ["waitlist", "Waitlist", Mail],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "nb-border nb-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest " +
                (tab === id ? "bg-accent" : "bg-card")
              }
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NbBox className="nb-shadow bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenue (paid)</p>
              <p className="mt-2 font-mono text-3xl font-bold">{revenue}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Demo checkout — flips to real money with Stripe keys.
              </p>
            </NbBox>
            <NbBox className="nb-shadow bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Orders</p>
              <p className="mt-2 font-mono text-3xl font-bold">{orders?.length ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(orders ?? []).filter((o) => o.status === "paid").length} paid ·{" "}
                {(orders ?? []).filter((o) => o.status === "pending").length} pending
              </p>
            </NbBox>
            <NbBox className="nb-shadow bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sessions booked</p>
              <p className="mt-2 font-mono text-3xl font-bold">{bookings?.length ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(bookings ?? []).filter((b) => b.status === "confirmed").length} upcoming
              </p>
            </NbBox>
            <NbBox className="nb-shadow bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Waitlist</p>
              <p className="mt-2 font-mono text-3xl font-bold">{waitlist?.length ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Emails from the landing page, ready for launch announcements.
              </p>
            </NbBox>
          </div>
        )}

      {/* GitHub repo health — live stats via the GitHub integration */}
      {tab === "overview" && (
        <NbBox className="nb-shadow mt-4 bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repo health · GitHub</p>
                {repo ? (
                  <a
                    href={`https://github.com/${repo.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-mono text-lg font-bold underline"
                  >
                    {repo.repo}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-bold uppercase">Not connected</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {repo?.latestReleaseTag && (
                  <span className="nb-border bg-[var(--chart-5)] px-2 py-0.5 font-mono text-xs font-bold">
                    release {repo.latestReleaseTag}
                  </span>
                )}
                <NbButton
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  disabled={refreshing}
                  onClick={async () => {
                    setRefreshing(true);
                    setRepoMsg(null);
                    try {
                      const r = await refreshRepo({});
                      setRepoMsg(r.message);
                    } catch (e) {
                      setRepoMsg(e instanceof Error ? e.message : "Refresh failed.");
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                >
                  <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
                </NbButton>
              </div>
            </div>

            {repo ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="nb-border bg-background px-3 py-2">
                  <p className="font-mono text-xl font-bold">{repo.stars}</p>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
                <div className="nb-border bg-background px-3 py-2">
                  <p className="font-mono text-xl font-bold">{repo.forks}</p>
                  <p className="text-xs text-muted-foreground">Forks</p>
                </div>
                <div className="nb-border bg-background px-3 py-2">
                  <p className="font-mono text-xl font-bold">{repo.openIssues}</p>
                  <p className="text-xs text-muted-foreground">Open issues</p>
                </div>
                <div className="nb-border bg-background px-3 py-2">
                  <p className="font-mono text-xl font-bold">{timeAgo(repo.pushedAt)}</p>
                  <p className="text-xs text-muted-foreground">Last push</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add a <span className="nb-code px-1">GITHUB_TOKEN</span> in the
                Keys tab to connect this project's repository — live stars,
                forks, issues, and the latest release will show here and in
                the "Built in the open" section on the landing page.
              </p>
            )}
            {repoMsg && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">{repoMsg}</p>
            )}
          </NbBox>
        )}

        {/* Insights */}
        {tab === "insights" && (
          <div className="mt-6 space-y-6">
            {!insights ? (
              <p className="text-sm text-muted-foreground">Computing…</p>
            ) : (
              <>
                {/* Free-lesson funnel */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Free-lesson funnel · signed-in learners
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {insights.funnel.map((f, i) => {
                      const max = insights.funnel[0]?.reached || 1;
                      const pct = Math.round((f.reached / max) * 100);
                      return (
                        <div
                          key={f.title}
                          className="nb-border bg-card px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-bold">
                              {i + 1}. {f.title}
                            </span>
                            <span className="font-mono text-xs">{f.reached}</span>
                          </div>
                          <div className="nb-border mt-1.5 h-2.5 w-full bg-background">
                            <div
                              className="h-full bg-[var(--chart-3)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Guests play the free lesson without signing in, so this
                    undercounts the very top. Step 4 → completion is your
                    readiness to buy signal.
                  </p>
                </div>

                {/* Module engagement */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Module engagement
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {insights.modules.map((m) => (
                      <NbBox
                        key={m.slug}
                        className="bg-card px-4 py-3"
                      >
                        <p className="font-mono text-xs text-muted-foreground">
                          /{m.slug}
                        </p>
                        <p className="mt-0.5 text-sm font-bold uppercase leading-tight">
                          {m.title}
                        </p>
                        <div className="mt-2 flex gap-4 font-mono text-xs">
                          <span>
                            <strong>{m.started}</strong> started
                          </span>
                          <span>
                            <strong>{m.completed}</strong> finished
                          </span>
                          <span>
                            <strong>{m.purchased}</strong> bought
                          </span>
                        </div>
                      </NbBox>
                    ))
                    }
                  </div>
                </div>

                {/* Totals */}
                <div className="nb-border bg-secondary px-4 py-3 font-mono text-xs">
                  {insights.totals.learnersTracked} tracked lesson learners ·{" "}
                  {insights.totals.purchases} purchases ·{" "}
                  {insights.totals.bookings} sessions ·{" "}
                  {insights.totals.waitlist} on waitlist
                </div>
              </>
            )}
          </div>
        )}

        {/* Lessons manager */}
        {tab === "lessons" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="space-y-2">
              {(lessons ?? [])
                .sort((a, b) => a.order - b.order)
                .map((l) => (
                  <NbBox key={l._id} className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase leading-tight">{l.title}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        /{l.slug} · ${((l.priceCents) / 100).toFixed(0)} · {l.minutes}min ·{" "}
                        {l.isPublished ? "published" : "draft"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <NbButton
                        variant="ghost"
                        className="px-2 py-1 text-[10px]"
                        onClick={() =>
                          setEditing({
                            id: l._id,
                            slug: l.slug,
                            title: l.title,
                            tagline: l.tagline,
                            description: l.description,
                            level: l.level,
                            priceCents: l.priceCents,
                            isFree: l.isFree,
                            isPublished: l.isPublished,
                            minutes: l.minutes,
                            topics: l.topics.join(", "),
                            order: l.order,
                          })
                        }
                      >
                        Edit
                      </NbButton>
                      <NbButton
                        variant={l.isPublished ? "ghost" : "accent"}
                        className="px-2 py-1 text-[10px]"
                        onClick={() => void publishLesson({ id: l._id, isPublished: !l.isPublished })}
                      >
                        {l.isPublished ? "Unpublish" : "Publish"}
                      </NbButton>
                      <NbButton
                        variant="ghost"
                        className="px-2 py-1 text-[10px]"
                        onClick={() => void deleteLesson({ id: l._id })}
                      >
                        Delete
                      </NbButton>
                    </div>
                  </NbBox>
                ))}
            </div>

            {/* Lesson editor */}
            <NbBox className="h-fit bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {editing?.id ? "Edit lesson" : "New lesson"}
              </p>
              <div className="mt-3 grid gap-2">
                <input
                  className="nb-border bg-background px-2.5 py-1.5 text-sm"
                  placeholder="slug (e.g. my-module)"
                  value={editing?.slug ?? ""}
                  onChange={(e) => setEditing((s) => s && { ...s, slug: e.target.value })}
                />
                <input
                  className="nb-border bg-background px-2.5 py-1.5 text-sm"
                  placeholder="Title"
                  value={editing?.title ?? ""}
                  onChange={(e) => setEditing((s) => s && { ...s, title: e.target.value })}
                />
                <input
                  className="nb-border bg-background px-2.5 py-1.5 text-sm"
                  placeholder="Tagline"
                  value={editing?.tagline ?? ""}
                  onChange={(e) => setEditing((s) => s && { ...s, tagline: e.target.value })}
                />
                <textarea
                  className="nb-border bg-background px-2.5 py-1.5 text-sm"
                  rows={3}
                  placeholder="Description"
                  value={editing?.description ?? ""}
                  onChange={(e) => setEditing((s) => s && { ...s, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="nb-border bg-background px-2 py-1.5 text-sm"
                    value={editing?.level ?? "beginner"}
                    onChange={(e) =>
                      setEditing((s) => s && { ...s, level: e.target.value as (typeof LEVELS)[number] })
                    }
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="nb-border bg-background px-2.5 py-1.5 text-sm"
                    placeholder="minutes"
                    value={editing?.minutes ?? 45}
                    onChange={(e) => setEditing((s) => s && { ...s, minutes: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="nb-border bg-background px-2.5 py-1.5 text-sm"
                    placeholder="price cents"
                    value={editing?.priceCents ?? 2900}
                    onChange={(e) => setEditing((s) => s && { ...s, priceCents: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="nb-border bg-background px-2.5 py-1.5 text-sm"
                    placeholder="order"
                    value={editing?.order ?? 10}
                    onChange={(e) => setEditing((s) => s && { ...s, order: Number(e.target.value) })}
                  />
                </div>
                <input
                  className="nb-border bg-background px-2.5 py-1.5 text-sm"
                  placeholder="topics (comma-separated)"
                  value={editing?.topics ?? ""}
                  onChange={(e) => setEditing((s) => s && { ...s, topics: e.target.value })}
                />
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editing?.isFree ?? false}
                      onChange={(e) => setEditing((s) => s && { ...s, isFree: e.target.checked })}
                    />
                    Free
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editing?.isPublished ?? false}
                      onChange={(e) => setEditing((s) => s && { ...s, isPublished: e.target.checked })}
                    />
                    Published
                  </label>
                </div>
                <div className="flex gap-2">
                  <NbButton
                    onClick={async () => {
                      if (!editing) return;
                      setError(null);
                      try {
                        await upsertLesson({
                          id: editing.id,
                          slug: editing.slug.trim(),
                          title: editing.title.trim(),
                          tagline: editing.tagline.trim(),
                          description: editing.description.trim(),
                          level: editing.level,
                          priceCents: editing.priceCents,
                          isFree: editing.isFree,
                          isPublished: editing.isPublished,
                          minutes: editing.minutes,
                          topics: editing.topics.split(",").map((t) => t.trim()).filter(Boolean),
                          order: editing.order,
                        });
                        setEditing(null);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Save failed.");
                      }
                    }}
                  >
                    Save lesson
                  </NbButton>
                  <NbButton variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </NbButton>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </NbBox>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div className="mt-6 space-y-2">
            {(orders ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {(orders ?? [])
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((o) => (
                <NbBox key={o._id} className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm">
                      {o.lessonSlug} · ${(o.amountCents / 100).toFixed(2)} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                    {(o.buyerName || o.buyerEmail) && (
                      <p className="text-xs text-muted-foreground">
                        {o.buyerName ?? "Student"}
                        {o.buyerEmail ? ` · ${o.buyerEmail}` : ""}
                      </p>
                    )}
                  </div>
                  <NbTag
                    className={
                      o.status === "paid"
                        ? "bg-[var(--chart-2)]"
                        : o.status === "pending"
                          ? "bg-accent"
                          : "bg-muted"
                    }
                  >
                    {o.status}
                  </NbTag>
                </NbBox>
              ))}
          </div>
        )}

        {/* Sessions */}
        {tab === "sessions" && (
          <div className="mt-6 space-y-2">
            {(bookings ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions booked yet.</p>
            )}
            {(bookings ?? [])
              .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
              .map((b) => (
                <NbBox key={b._id} className="bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-sm font-bold">
                      {b.date} · {b.time}
                    </p>
                    <NbTag
                      className={
                        b.status === "confirmed"
                          ? "bg-[var(--chart-2)]"
                          : "bg-muted"
                      }
                    >
                      {b.status}
                    </NbTag>
                  </div>
                  <p className="mt-1 text-sm">
                    Module: {b.lessonSlug}
                    {(b.studentName || b.studentEmail) && (
                      <span className="text-muted-foreground">
                        {" "}· {b.studentName ?? "Student"}
                        {b.studentEmail ? ` (${b.studentEmail})` : ""}
                      </span>
                    )}
                    {b.timezone && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {" "}· {b.timezone}
                      </span>
                    )}
                  </p>
                  {b.status === "confirmed" && (
                    <div className="mt-2 flex gap-2">
                      <NbButton
                        variant="ghost"
                        className="px-2 py-1 text-[10px]"
                        onClick={() =>
                          void updateBookingStatus({
                            bookingId: b._id,
                            status: "cancelled",
                          })
                        }
                      >
                        Cancel session
                      </NbButton>
                      <NbButton
                        variant="ghost"
                        className="px-2 py-1 text-[10px]"
                        onClick={() =>
                          void updateBookingStatus({
                            bookingId: b._id,
                            status: "confirmed",
                          })
                        }
                      >
                        Keep confirmed
                      </NbButton>
                    </div>
                  )}
                  {b.note && (
                    <p className="nb-border mt-2 bg-background px-2.5 py-1.5 text-sm">
                      <span className="font-bold">Student note:</span> {b.note}
                    </p>
                  )}
                </NbBox>
              ))}
          </div>
        )}

        {/* Waitlist */}
        {tab === "waitlist" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {(waitlist ?? []).length} people waiting. Copy the list into
                your email tool when you launch.
              </p>
              <NbButton
                variant="ghost"
                className="px-2.5 py-1.5 text-[10px]"
                disabled={(waitlist ?? []).length === 0}
                onClick={async () => {
                  const emails = (waitlist ?? [])
                    .sort((a, b) => a.createdAt - b.createdAt)
                    .map((w) => w.email)
                    .join(", ");
                  try {
                    await navigator.clipboard.writeText(emails);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy className="size-3" /> {copied ? "Copied!" : "Copy all emails"}
              </NbButton>
            </div>
            <div className="mt-3 space-y-1.5">
              {(waitlist ?? [])
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((w) => (
                  <NbBox
                    key={w._id}
                    className="flex items-center justify-between bg-card px-4 py-2"
                  >
                    <p className="font-mono text-sm">{w.email}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                  </NbBox>
                ))}
              {(waitlist ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nobody yet — the landing page form fills this list.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Moderation */}
        {tab === "moderation" && (
          <div className="mt-6 space-y-3">
            {(pending ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing waiting for review. Nice.
              </p>
            )}
            {(pending ?? []).map((p) => (
              <NbBox key={p._id} className="bg-card p-4">
                <p className="font-bold uppercase">{p.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs underline">
                    {p.url}
                  </a>
                )}
                <div className="mt-3 flex gap-2">
                  <NbButton onClick={() => void moderate({ postId: p._id, approve: true })}>
                    Approve
                  </NbButton>
                  <NbButton
                    variant="ghost"
                    onClick={() => void moderate({ postId: p._id, approve: false })}
                  >
                    Reject
                  </NbButton>
                </div>
              </NbBox>
            ))}
          </div>
        )}
      </NbSection>
    </div>
  );
}
