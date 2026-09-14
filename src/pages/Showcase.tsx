/**
 * Showcase — student builds, moderated. Anyone can browse; signed-in
 * students can submit their own build and comment on others'.
 */
import { useState } from "react";
import { ExternalLink, MessageCircle, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { NbBox, NbButton, NbSection, NbTag } from "@/components/nb";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommentsPanel({ postId }: { postId: string }) {
  const { isAuthenticated, user } = useAuth();
  const comments = useQuery(api.showcase.listComments, { postId: postId as never });
  const createComment = useMutation(api.showcase.createComment);
  const deleteComment = useMutation(api.showcase.deleteMyComment);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await createComment({ postId: postId as never, body });
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post comment.");
    }
  };

  return (
    <div className="border-t-2 border-dashed border-border px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <MessageCircle className="size-3.5" />
        Comments ({comments?.length ?? 0})
      </p>
      <div className="mt-2 space-y-2">
        {(comments ?? []).map((c) => (
          <div key={c._id} className="nb-border flex items-start justify-between gap-2 bg-background px-2.5 py-1.5">
            <p className="text-sm leading-snug">
              <span className="font-bold">{c.authorName ?? "A student"}:</span>{" "}
              {c.body}
            </p>
            {user?._id === c.userId && (
              <button
                onClick={() => void deleteComment({ commentId: c._id })}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete your comment"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {comments?.length === 0 && (
          <p className="text-xs text-muted-foreground">Be the first to comment.</p>
        )}
      </div>
      {isAuthenticated ? (
        <div className="mt-2 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an encouraging comment…"
            maxLength={500}
            className="nb-border flex-1 bg-background px-2.5 py-1.5 text-sm outline-none"
          />
          <NbButton onClick={submit} disabled={body.trim().length === 0} className="px-3 py-1.5">
            <Send className="size-3.5" />
          </NbButton>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          <a href="/auth" className="underline">Sign in</a> to join the conversation.
        </p>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function Showcase() {
  usePageTitle("Student showcase");
  const { isAuthenticated } = useAuth();
  const posts = useQuery(api.showcase.listApproved, {});
  const createPost = useMutation(api.showcase.createPost);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitPost = async () => {
    setError(null);
    try {
      await createPost({ title, description, url: url || undefined });
      setTitle("");
      setUrl("");
      setDescription("");
      setShowForm(false);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/showcase" />
      <NbSection className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <NbTag className="bg-accent">Student showcase</NbTag>
            <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Built by people like you
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Real sites made in this course. Submit yours — after a quick
              review it appears here, and classmates can cheer you on.
            </p>
          </div>
          {isAuthenticated && (
            <NbButton onClick={() => setShowForm((s) => !s)}>
              {showForm ? "Close form" : "Share your build"}
            </NbButton>
          )}
        </div>

        {submitted && (
          <NbBox className="mt-6 bg-[var(--chart-2)] p-4 text-sm">
            <p className="font-bold uppercase">Thanks! Your build is in review.</p>
            <p className="mt-1">
              We check every submission to keep the showcase spam-free. Yours
              will appear here shortly.
            </p>
          </NbBox>
        )}

        {showForm && (
          <NbBox className="mt-6 bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Share what you made
            </p>
            <div className="mt-3 grid gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project name — e.g. Maria's Bakery Homepage"
                maxLength={80}
                className="nb-border bg-background px-3 py-2 text-sm outline-none"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Live link (optional) — https://…"
                className="nb-border bg-background px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What did you build, and what surprised you along the way?"
                className="nb-border bg-background px-3 py-2 text-sm outline-none"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <NbButton onClick={submitPost} className="justify-self-start">
                Submit for review
              </NbButton>
            </div>
          </NbBox>
        )}

        {/* Posts */}
        {!posts ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading showcase…</p>
        ) : posts.length === 0 ? (
          <NbBox className="mt-8 bg-card p-8 text-center">
            <p className="font-bold uppercase">No builds yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish the free lesson and be the first to share what you made.
            </p>
          </NbBox>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {posts.map((p) => (
              <NbBox key={p._id} className="bg-card">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold uppercase leading-tight">
                        {p.title}
                      </h2>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        by {p.authorName ?? "A student"} · {timeAgo(p.createdAt)}
                      </p>
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nb-border nb-press flex shrink-0 items-center gap-1 bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                      >
                        Visit <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <CommentsPanel postId={p._id} />
              </NbBox>
            ))}
          </div>
        )}
      </NbSection>
    </div>
  );
}
