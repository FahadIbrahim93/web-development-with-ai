import { motion } from "framer-motion";
import { NbBox, NbRouterLink, NbSection, NbTag } from "@/components/nb";
import { usePageTitle } from "@/hooks/use-page-title";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background"
    >
      <NbSection className="flex min-h-screen items-center py-16">
        <NbBox className="nb-shadow-lg mx-auto max-w-lg bg-card p-8 text-center">
          <NbTag className="bg-[var(--chart-4)]">Error 404</NbTag>
          <h1 className="mt-4 text-5xl font-bold uppercase tracking-tight">
            Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            This link doesn't lead anywhere — but your website journey does.
            Head back and keep building.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <NbRouterLink to="/" variant="primary">
              Back to home
            </NbRouterLink>
            <NbRouterLink to="/lesson" variant="accent">
              Free lesson
            </NbRouterLink>
          </div>
        </NbBox>
      </NbSection>
    </motion.div>
  );
}
