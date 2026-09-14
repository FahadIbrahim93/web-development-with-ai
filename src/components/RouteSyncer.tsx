/**
 * Preview-integration plumbing, kept out of main.tsx so the app entrypoint
 * stays fast-refresh friendly (entry files that define components break HMR).
 */
import { useEffect } from "react";
import { useLocation } from "react-router";

/** Minimal loading UI shown while a lazy route chunk downloads. */
export function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * Bridge between the app and its embedding frame (Freebuff preview toolbar).
 * Outbound: announces every route change so the toolbar can reflect the URL.
 * Inbound: honors back/forward navigation commands — only from the direct
 * parent frame, so arbitrary cross-frame pages can't steer app history.
 */
export function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    // The embedder's origin is not statically known, so the outgoing sync
    // necessarily targets "*"; it carries only the pathname, no secrets.
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const data = event.data as { type?: string; direction?: string } | null;
      if (data?.type === "navigate") {
        if (data.direction === "back") window.history.back();
        if (data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
