/**
 * Shared metadata for the free interactive lesson.
 *
 * LESSON_ID keys progress rows in the database and localStorage, and
 * LESSON_STEP_TITLES labels the funnel everywhere it is shown (lesson shell,
 * dashboard, certificate, admin insights). One definition here means the
 * wording can never drift between screens, and renaming the lesson id stays
 * a one-line change.
 *
 * Pure data, no dependencies — safe for both React and Convex imports
 * (Convex functions use a relative path; the frontend uses "@/lib").
 */

/** Stable identifier persisted with every lesson-progress row. */
export const LESSON_ID = "webdev-ai-v1";

/** Human titles for the four lesson steps, in order. */
export const LESSON_STEP_TITLES = [
  "What is a website?",
  "What is it made of?",
  "Where does AI fit in?",
  "Build one yourself",
] as const;
