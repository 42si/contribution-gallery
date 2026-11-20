import { UserStats } from "../types";
import { emblem, latticeAcross, latticeDefs, latticeGround, ROWS, setInCells, stamp, writeOn } from "./cells";
import { DEFAULT_NUMERAL_FONT, NumeralFont } from "./numerals";
import { mix } from "./scenes/kit";
import { cardHeader, cardSvg, galleryTheme, HALF_HEIGHT, HALF_WIDTH, number, numberSize, PAD } from "./theme";
import { CARD_TITLES } from "./titles";

const EMBLEMS = {
  star: ["..1..", ".111.", "11111", ".111.", ".1.1."],
  pull: ["1...1", "1...1", "1..1.", "111..", "1...."],
  issue: [".111.", "1...1", "1.1.1", "1...1", ".111."],
  person: [".111.", ".111.", ".....", ".111.", "11111"],
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "May 2019" from an ISO date, or nothing when the date is missing */
function monthYear(date: string | undefined): string {
  const [year, month] = (date ?? "").split("-");
  return /^\d{4}$/.test(year) && MONTHS[Number(month) - 1] ? `${MONTHS[Number(month) - 1]} ${year}` : "";
}

/**
 * The commit total is written into a strip of contribution graph, cell by
 * cell; four supporting totals sit under it as a single ledger line.
 */
export function renderStatsSVG(stats: UserStats, dark: boolean, font: NumeralFont = DEFAULT_NUMERAL_FONT): string {
  const theme = galleryTheme(dark);
  const hues = theme.spectrum;
  const commits = number(stats.commits);
  const width = HALF_WIDTH - PAD * 2;

  // A wider number gets more, smaller columns rather than a clipped total
  const written = setInCells(commits);
  const lattice = latticeAcross(PAD, 60, width, Math.max(34, written.cols + 2));
  const lit = written.cells.map((cell) => {
    const fill = mix(theme.lit[0], theme.lit[1], cell.row / (ROWS - 1));
    return stamp("cell", lattice, cell.col + 1, cell.row, `class="lit" fill="${fill}" style="animation-delay:${(-6 + (cell.col + cell.row) * 0.07).toFixed(2)}s"`);
  }).join("");

  const rows = [
    { label: "Stars", value: stats.stars, emblem: EMBLEMS.star, hue: hues.amber, said: "stars earned" },
    { label: "Pull requests", value: stats.pullRequests, emblem: EMBLEMS.pull, hue: hues.violet, said: "pull requests" },
    { label: "Issues", value: stats.issues, emblem: EMBLEMS.issue, hue: hues.emerald, said: "issues opened" },
    { label: "Followers", value: stats.followers, emblem: EMBLEMS.person, hue: hues.sky, said: "followers" },
  ];
  const column = width / rows.length;
  const since = monthYear(stats.firstContribution);
  const metrics = rows.map((row, i) => {
    const x = PAD + i * column;
    const value = number(row.value);
    return `${emblem(row.emblem, x, 186, 3, 2.4, (_, col, line) => `class="emblem" fill="${row.hue}" style="animation-delay:${(-(col + line) * 0.22 - i * 0.9).toFixed(2)}s"`)}
    <text class="number" x="${x + 21}" y="199" font-size="${numberSize(value, 19, column - 27).toFixed(1)}">${value}</text>
    <text class="detail" x="${x}" y="222">${row.label}</text>`;
  }).join("\n");

  return cardSvg({
    label: "GitHub activity",
    description: `${stats.login}: ${commits} commits, ${rows.map(r => `${number(r.value)} ${r.said}`).join(", ")}. All-time totals.`,
    width: HALF_WIDTH, height: HALF_HEIGHT, theme, subset: "stats", font,
    css: `.lit{animation:glint 6s ease-in-out infinite}@keyframes glint{0%,64%,100%{opacity:.82}78%{opacity:1}}
    .emblem{animation:emblem 5s ease-in-out infinite}@keyframes emblem{0%,100%{opacity:.7}50%{opacity:1}}
    @media(prefers-reduced-motion:reduce){.lit,.emblem{animation:none;opacity:1}}`,
    body: `${cardHeader(CARD_TITLES.stats, since ? `since ${since}` : "all time", HALF_WIDTH)}
    <defs>${latticeDefs("cell", lattice, theme.inset)}${writeOn("write", lattice, 0.25)}</defs>
    ${latticeGround("cell", lattice)}
    <g clip-path="url(#write)">${lit}</g>
    <text class="label" x="${PAD}" y="${(lattice.y + lattice.height + 21).toFixed(1)}">commits</text>
    <path d="M${PAD} 164.5H${HALF_WIDTH - PAD}" stroke="${theme.border}"/>
    ${metrics}`,
  });
}
