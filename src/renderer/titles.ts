/**
 * Every string set in the display typeface. The embedded font carries only
 * these letters (scripts/update-display-font.ts), so a new title means
 * regenerating the subset — the gallery tests fail until that is done.
 */
export const CARD_TITLES = {
  stats: "Activity",
  langs: "Languages",
  streak: "Streak",
  trophy: "Milestones",
} as const;

/** Heading of the ambient card when motion is off and no scene is playing */
export const STILL_TITLE = "A year of contributions";

export type DisplaySubset = keyof typeof CARD_TITLES | "ambient";
