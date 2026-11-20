import { UserStats } from "../types";
import { DEFAULT_NUMERAL_FONT, NumeralFont } from "./numerals";
import { mix } from "./scenes/kit";
import { CARD_WIDTH, cardHeader, cardSvg, GalleryTheme, galleryTheme, number, numberSize, PAD } from "./theme";
import { CARD_TITLES } from "./titles";

const RANKS = ["SSS", "SS", "S", "AAA", "AA", "A", "B", "C"] as const;
/** "1" body, "2" handles, "3" the lit edge of the bowl */
const CUP = [".3111111.", "2.31111.2", ".2311112.", "..31111..", "....1....", "...111...", "..31111.."];
const PITCH = 5;

interface Category { title: string; value: number; thresholds: number[]; }

function categories(stats: UserStats): Category[] {
  return [
    { title: "Commits", value: stats.commits, thresholds: [4000, 2000, 1000, 500, 200, 100, 50, 1] },
    { title: "Followers", value: stats.followers, thresholds: [800, 400, 200, 100, 50, 25, 10, 1] },
    { title: "Stars", value: stats.stars, thresholds: [2000, 700, 200, 100, 50, 30, 10, 1] },
    { title: "Repos", value: stats.repos, thresholds: [150, 100, 50, 30, 20, 10, 5, 1] },
    { title: "Pull requests", value: stats.pullRequests, thresholds: [1000, 500, 200, 100, 50, 25, 10, 1] },
    { title: "Issues", value: stats.issues, thresholds: [500, 300, 150, 80, 40, 20, 8, 1] },
    { title: "Reviews", value: stats.reviews, thresholds: [500, 300, 150, 80, 40, 20, 8, 1] },
  ];
}

/** Gold for the S ranks, silver for A, bronze for B, a first green shoot for C */
function metal(rank: number, theme: GalleryTheme): string {
  if (rank < 0) return theme.faint;
  if (rank <= 2) return theme.dark ? "#f2c350" : "#b07a10";
  if (rank <= 5) return theme.dark ? "#c3cede" : "#66768a";
  if (rank === 6) return theme.dark ? "#e19a6c" : "#ad5f2c";
  return theme.greens[2];
}

/**
 * Seven pixel cups, cast in the metal of their rank. Light crosses them one
 * after another, and each names the next rank within reach.
 */
export function renderTrophySVG(stats: UserStats, dark: boolean, font: NumeralFont = DEFAULT_NUMERAL_FONT): string {
  const theme = galleryTheme(dark);
  const cats = categories(stats).map((cat) => ({ ...cat, rank: cat.thresholds.findIndex(threshold => cat.value >= threshold) }));
  const column = (CARD_WIDTH - PAD * 2) / cats.length;
  const badges = cats.map((cat, i) => {
    const { rank } = cat;
    const label = rank < 0 ? "—" : RANKS[rank];
    const color = metal(rank, theme);
    const tones: Record<string, string> = {
      "1": color,
      "2": mix(color, theme.background, 0.5),
      "3": mix(color, theme.dark ? "#ffffff" : theme.background, theme.dark ? 0.45 : 0.3),
    };
    const x = PAD + i * column;
    const cup = CUP.flatMap((line, row) => [...line].map((tone, col) => tone === "." ? "" :
      `<use href="#cup" x="${x + col * PITCH}" y="${60 + row * PITCH}" fill="${tones[tone]}"${rank >= 0 ? ` class="shine d${col + row}"` : ""}/>`
    )).join("");
    const next = rank < 0 ? cat.thresholds[cat.thresholds.length - 1] : cat.thresholds[rank - 1];
    const ahead = rank === 0 ? "Top rank" : `${RANKS[rank < 0 ? RANKS.length - 1 : rank - 1]} at ${number(next)}`;
    const value = number(cat.value);
    return `<g${rank >= 0 ? ` style="--t:${(i * 0.5 - 8).toFixed(1)}s"` : ""}><title>${cat.title}: ${value}, rank ${rank < 0 ? "unranked" : label}</title>
      ${cup}
      ${rank >= 0 && rank <= 2 ? [[51, 62], [57, 81]].map(([dx, y], k) => `<rect class="spark" x="${(x + dx).toFixed(1)}" y="${y}" width="3" height="3" rx=".8" fill="${tones["3"]}" style="animation-delay:-${(i * 0.6 + k * 1.3).toFixed(1)}s"/>`).join("") : ""}
      <text x="${x.toFixed(1)}" y="112" font-size="11" font-weight="600" letter-spacing=".6" style="fill:${color}">${label}</text>
      <text class="number" x="${x.toFixed(1)}" y="136" font-size="${numberSize(value, 20, column - 14).toFixed(1)}">${value}</text>
      <text class="label" x="${x.toFixed(1)}" y="154">${cat.title}</text>
      <text class="detail" x="${x.toFixed(1)}" y="170">${ahead}</text>
    </g>`;
  }).join("\n");

  return cardSvg({
    label: "GitHub milestones",
    description: cats.map(cat => `${cat.title}: ${number(cat.value)}, ${RANKS[cat.rank] ?? "unranked"}`).join(". "),
    width: CARD_WIDTH, height: 194, theme, subset: "trophy", font,
    css: `.shine{animation:shine 8s ease-in-out infinite;animation-delay:calc(var(--t) + var(--d))}
    ${Array.from({ length: 15 }, (_, d) => `.d${d}{--d:${(d * 0.07).toFixed(2)}s}`).join("")}
    @keyframes shine{0%,88%,100%{opacity:.8}94%{opacity:1}}
    .spark{animation:spark 3.9s ease-in-out infinite}@keyframes spark{0%,100%{opacity:0}50%{opacity:.95}}
    @media(prefers-reduced-motion:reduce){.shine{animation:none}.spark{animation:none;opacity:.6}}`,
    body: `${cardHeader(CARD_TITLES.trophy, "ranked from C up to SSS", CARD_WIDTH)}
    <defs><rect id="cup" width="3.9" height="3.9" rx=".95"/></defs>
    ${badges}`,
  });
}
