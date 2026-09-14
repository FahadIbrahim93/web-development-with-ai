/**
 * Vitest config. Kept separate from vite.config.ts so the production build
 * never loads test machinery. The "@" alias is re-declared here because a
 * standalone vitest config replaces (not merges with) vite.config.ts.
 */
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
