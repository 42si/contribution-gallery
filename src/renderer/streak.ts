import { UserStats } from "../types";
import { latticeDefs, latticeGround, latticeOf, setInCells, stamp, writeOn } from "./cells";
import { DEFAULT_NUMERAL_FONT, NumeralFont } from "./numerals";
import { CARD_WIDTH, cardHeader, cardSvg, galleryTheme, HALF_WIDTH, number, numberSize, PAD } from "./theme";
import { CARD_TITLES } from "./titles";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The cell pitch of the half-width cards, so the gallery's lattices match */
const PITCH = (HALF_WIDTH - PAD * 2) / (34 - 3 / 14);

function dateLabel(date: string, withYear = false): string {
  const [year, month, day] = date.split("-");
  if (!year || !MONTHS[Number(month) - 1] || !Number(day)) return "—";
  return `${MONTHS[Number(month) - 1]} ${Number(day)}${withYear ? `, ${year}` : ""}`;
}

function range(start: string, end: string, currentYear: string): string {
  const crossYear = start.slice(0, 4) !== end.slice(0, 4);
  return `${dateLabel(start, crossYear)} – ${dateLabel(end, crossYear || end.slice(0, 4) !== currentYear)}`;
}

/**
 * The current streak burns in contribution cells beside a pixel flame; the
 * longest streak and the all-time total stand next to it in plain figures.
 */
export function renderStreakSVG(stats: UserStats, dark: boolean, font: NumeralFont = DEFAULT_NUMERAL_FONT): string {
  const theme = galleryTheme(dark);
  const year = stats.generatedAt.slice(0, 4);
  const current = stats.currentStreak.days;
  const longest = stats.longestStreak.days;
  const burning = current > 0;

  // "*" is the flame glyph; a streak of zero is set alone, unlit
  const written = setInCells(burning ? `${current} *` : "0");
  const lattice = latticeOf(PAD, 60, Math.max(27, written.cols + 2), PITCH);
  const core = dark ? "#fffbe0" : "#ffcf4a";
  const lit = written.cells.map((cell) => {
    const flame = cell.char === "*";
    const fill = !burning ? theme.faint : cell.tone === "2" ? core : theme.flame[cell.row];
    const flicker = burning ? ` class="fl p${(cell.col * 7 + cell.row * 13) % 6}${flame ? " fast" : ""}"` : "";
    return stamp("cell", lattice, cell.col + 1, cell.row, `fill="${fill}"${flicker}`);
  }).join("");
  // Sparks leave the tip of the flame and rise out of the lattice
  const tip = written.cells.find((cell) => cell.char === "*");
  const embers = burning && tip ? [0, 1, 2].map((i) =>
    `<rect class="ember" x="${(lattice.x + (tip.col + 1.2 + (i - 1) * 1.1) * lattice.pitch).toFixed(1)}" y="${(lattice.y + (i % 2) * 7).toFixed(1)}" width="3" height="3" rx=".8" fill="${theme.flame[1]}" style="animation-delay:-${(i * 1.2).toFixed(1)}s"/>`
  ).join("") : "";

  const record = burning && current >= longest;
  const facts = [
    {
      label: "Longest streak", value: number(longest), unit: longest === 1 ? "day" : "days",
      detail: longest <= 0 ? "No streak recorded yet" : record ? "This one, and still going"
        : range(stats.longestStreak.start, stats.longestStreak.end, year),
    },
    {
      label: "Total contributions", value: number(stats.totalContributions), unit: "",
      detail: stats.firstContribution ? `Since ${dateLabel(stats.firstContribution, true)}` : "All time",
    },
  ];
  const left = lattice.x + lattice.width + 44;
  const column = (CARD_WIDTH - PAD - left) / facts.length;
  const figures = facts.map((fact, i) => {
    const x = left + i * column;
    const size = numberSize(fact.value, 28, column - 60);
    return `<text class="detail" x="${x.toFixed(1)}" y="72">${fact.label}</text>
    <text x="${x.toFixed(1)}" y="108"><tspan class="number" font-size="${size.toFixed(1)}">${fact.value}</tspan>${fact.unit ? `<tspan class="detail" dx="6">${fact.unit}</tspan>` : ""}</text>
    <text class="detail" x="${x.toFixed(1)}" y="147">${fact.detail}</text>`;
  }).join("\n");
  const caption = burning
    ? `<tspan class="label">${current === 1 ? "day" : "days"} in a row</tspan><tspan class="detail" dx="9">${range(stats.currentStreak.start, stats.currentStreak.end, year)}</tspan>`
    : `<tspan class="label">A fresh start awaits</tspan>`;

  return cardSvg({
    label: "Contribution streaks",
    description: `${number(stats.totalContributions)} total contributions. Current streak: ${current} days. Longest streak: ${longest} days.`,
    width: CARD_WIDTH, height: 172, theme, subset: "streak", font,
    css: `.fl{animation:flicker 2.7s ease-in-out infinite}.fast{animation-duration:1.5s}
    ${[0, 1, 2, 3, 4, 5].map((p) => `.p${p}{animation-delay:-${(p * 0.47).toFixed(2)}s}`).join("")}
    @keyframes flicker{0%,100%{opacity:1}40%{opacity:${dark ? ".6" : ".74"}}70%{opacity:.92}}
    .ember{animation:ember 3.6s ease-out infinite;opacity:0}@keyframes ember{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(-22px)}}
    @media(prefers-reduced-motion:reduce){.fl{animation:none}.ember{display:none}}`,
    body: `${cardHeader(CARD_TITLES.streak, "consecutive days with a contribution", CARD_WIDTH)}
    <defs>${latticeDefs("cell", lattice, theme.inset)}${writeOn("write", lattice, 0.25)}
      <filter id="glow" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${dark ? 5 : 3.5}"/></filter></defs>
    ${latticeGround("cell", lattice)}
    ${burning ? `<use href="#fire" filter="url(#glow)" opacity="${dark ? ".55" : ".22"}"/>` : ""}
    <g id="fire" clip-path="url(#write)">${lit}</g>${embers}
    <text x="${PAD}" y="147">${caption}</text>
    ${figures}`,
  });
}
