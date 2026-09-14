/**
 * SiteHeader — shared navigation for every page. Rebrand: Web Development
 * with AI. Includes the dark developer-facing mode toggle and a mobile
 * menu (phones previously had no way to reach Catalog/Showcase/Dashboard).
 */
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
// (menu closes via explicit onClick handlers — no route-change effect needed)
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { NbButton, NbSection } from "./nb";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/catalog", label: "Catalog" },
  { to: "/showcase", label: "Showcase" },
  { to: "/lesson", label: "Free lesson" },
  { to: "/dashboard", label: "Dashboard" },
];

export function SiteHeader({ active }: { active?: string }) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => window.localStorage.getItem("nb-theme") === "dark",
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("nb-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-secondary/95 backdrop-blur print:hidden">
      <NbSection className="flex items-center justify-between py-2.5">
        <Link
          to="/"
          className="nb-border nb-press bg-primary px-2 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground"
          onClick={() => setMenuOpen(false)}
        >
          Web Dev <span className="text-accent dark:text-background">×</span> AI
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {/* Desktop nav — no menu state to reset */}
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "nb-border nb-press px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest",
                active === item.to
                  ? "bg-accent text-accent-foreground"
                  : "bg-card",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="nb-border nb-press bg-card p-1.5"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {isAuthenticated ? (
            <NbButton
              variant="ghost"
              onClick={handleSignOut}
              className="hidden px-2.5 py-1.5 text-[11px] sm:inline-flex"
            >
              Sign out
            </NbButton>
          ) : (
            <Link
              to="/auth?returnTo=%2Fcatalog"
              className="nb-border nb-press hidden bg-accent px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground sm:inline-block"
            >
              Sign in
            </Link>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="nb-border nb-press bg-card p-1.5 md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </NbSection>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t-2 border-border bg-secondary md:hidden"
        >
          <NbSection className="grid gap-2 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "nb-border nb-press flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-widest",
                  active === item.to
                    ? "bg-accent text-accent-foreground"
                    : "bg-card",
                )}
              >
                {item.label}
                <span aria-hidden>→</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <NbButton
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-center py-2.5 text-xs"
              >
                Sign out
              </NbButton>
            ) : (
              <Link
                to="/auth?returnTo=%2Fcatalog"
                onClick={() => setMenuOpen(false)}
                className="nb-border nb-press bg-accent px-3 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-accent-foreground"
              >
                Sign in
              </Link>
            )}
          </NbSection>
        </nav>
      )}
    </header>
  );
}
