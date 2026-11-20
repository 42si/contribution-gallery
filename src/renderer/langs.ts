import { UserStats } from "../types";
import { latticeAcross, latticeDefs, latticeGround, ROWS } from "./cells";
import { DEFAULT_NUMERAL_FONT, NumeralFont } from "./numerals";
import { cardHeader, cardSvg, escapeXml, galleryTheme, HALF_HEIGHT, HALF_WIDTH, PAD } from "./theme";
import { CARD_TITLES } from "./titles";

const COLS = 34;
const LISTED = 10;
/** Seconds each language holds the light as the mosaic is read left to right */
const TURN = 2.4;

/** GitHub language colors, adjusted only when they disappear on the surface. */
function visibleColor(color: string | null, dark: boolean, fallback: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(color?.trim() ?? "");
  if (!match) return fallback;
  const n = parseInt(match[1], 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 255000;
  const blend = dark && brightness < .45 ? .35 : !dark && brightness > .8 ? -.3 : 0;
  return "#" + rgb.map(c => Math.round(c + ((blend > 0 ? 255 : 0) - c) * Math.abs(blend))
    .toString(16).padStart(2, "0")).join("");
}

/**
 * Share `cells` among `sizes` in proportion, by largest remainder, so the
 * counts always add up; every non-empty share keeps at least one cell.
 */
export function apportion(sizes: number[], cells: number): number[] {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (total <= 0) return sizes.map(() => 0);
  const exact = sizes.map(size => size / total * cells);
  const counts = exact.map(share => (share > 0 ? Math.max(1, Math.floor(share)) : 0));
  const byRemainder = exact.map((share, i) => ({ i, rest: share - Math.floor(share) })).sort((a, b) => b.rest - a.rest);
  for (let k = 0; counts.reduce((a, b) => a + b, 0) < cells; k++) counts[byRemainder[k % counts.length].i]++;
  // Guaranteed minimums can overshoot; the largest share gives the cells back
  while (counts.reduce((a, b) => a + b, 0) > cells) counts[counts.indexOf(Math.max(...counts))]--;
  return counts;
}

/**
 * The code is drawn as a contribution graph painted by language: cells fill
 * week by week in order of size, so each language's area is its share.
 */
export function renderLangsSVG(stats: UserStats, dark: boolean, font: NumeralFont = DEFAULT_NUMERAL_FONT): string {
  const theme = galleryTheme(dark);
  const all = (stats.languages ?? []).filter(l => Number.isFinite(l.size) && l.size > 0).sort((a, b) => b.size - a.size);
  const total = all.reduce((sum, l) => sum + l.size, 0);
  // Past the listed count, the tail is folded into one neutral entry
  const head = all.length > LISTED ? all.slice(0, LISTED - 1) : all;
  const tail = all.slice(head.length);
  const shown = [...head.map(l => ({ name: l.name, size: l.size, color: visibleColor(l.color, dark, theme.muted) })),
    ...(tail.length ? [{ name: `${tail.length} more`, size: tail.reduce((sum, l) => sum + l.size, 0), color: theme.faint }] : [])];
  const percent = (size: number) => `${(size / total * 100).toFixed(1)}%`;

  const lattice = latticeAcross(PAD, 60, HALF_WIDTH - PAD * 2, COLS);
  const { pitch, cell } = lattice;
  const gap = pitch - cell;
  const block = (col: number, row: number, cols: number, rows: number) =>
    `<rect x="${(lattice.x + col * pitch - gap / 2).toFixed(2)}" y="${(lattice.y + row * pitch - gap / 2).toFixed(2)}" width="${(cols * pitch).toFixed(2)}" height="${(rows * pitch).toFixed(2)}"/>`;
  const cycle = shown.length * TURN;
  const turn = (i: number) => `style="animation-delay:${(i * TURN - cycle).toFixed(1)}s"`;

  // Cells run down each column, then on to the next, like days into weeks
  let cursor = 0;
  const areas = apportion(shown.map(l => l.size), COLS * ROWS).map((count, i) => {
    const [first, last] = [cursor, cursor + count - 1];
    cursor += count;
    const [c0, r0, c1, r1] = [Math.floor(first / ROWS), first % ROWS, Math.floor(last / ROWS), last % ROWS];
    const blocks = c0 === c1 ? [block(c0, r0, 1, r1 - r0 + 1)] : [
      block(c0, r0, 1, ROWS - r0),
      c1 - c0 > 1 ? block(c0 + 1, 0, c1 - c0 - 1, ROWS) : "",
      block(c1, 0, 1, r1 + 1),
    ];
    return `<g class="share" data-language="${escapeXml(shown[i].name)}" data-cells="${count}" fill="${shown[i].color}" ${turn(i)}>${blocks.join("")}</g>`;
  }).join("");

  const half = (HALF_WIDTH - PAD * 2 - 20) / 2;
  const rowsPerColumn = Math.ceil(shown.length / 2);
  const legend = shown.map((lang, i) => {
    const x = PAD + Math.floor(i / rowsPerColumn) * (half + 20);
    const y = 153 + (i % rowsPerColumn) * 20;
    const name = lang.name.length > 17 ? `${lang.name.slice(0, 16)}…` : lang.name;
    return `<g><title>${escapeXml(lang.name)}</title>
      <rect class="swatch" x="${x}" y="${y - 8.5}" width="8" height="8" rx="2" fill="${lang.color}" ${turn(i)}/>
      <text class="detail numeric-detail" x="${x + 50}" y="${y}" text-anchor="end">${percent(lang.size)}</text>
      <text x="${x + 58}" y="${y}" font-size="12">${escapeXml(name)}</text>
    </g>`;
  }).join("\n");
  const summary = shown.length ? shown.map(l => `${l.name} ${percent(l.size)}`).join(", ") : "No language data yet";
  // Each language is bright for its turn, then steps back while the others take theirs
  const lit = (100 / Math.max(shown.length, 1));

  return cardSvg({
    label: "Language composition",
    description: `${summary}. Shares of indexed code by byte size.`,
    width: HALF_WIDTH, height: HALF_HEIGHT, theme, subset: "langs", font,
    css: `.share{animation:turn ${cycle.toFixed(1)}s ease-in-out infinite}.swatch{animation:turn ${cycle.toFixed(1)}s ease-in-out infinite}
    @keyframes turn{0%,${(lit * .85).toFixed(1)}%{opacity:1}${(lit * 1.5).toFixed(1)}%,${(100 - lit * .5).toFixed(1)}%{opacity:.6}100%{opacity:1}}
    @media(prefers-reduced-motion:reduce){.share,.swatch{animation:none}}`,
    body: `${cardHeader(CARD_TITLES.langs, "share of code, by size", HALF_WIDTH)}
    <defs>${latticeDefs("cell", lattice, shown.length ? "#fff" : theme.inset)}
      <mask id="mosaic" maskUnits="userSpaceOnUse" x="${lattice.x}" y="${lattice.y}" width="${lattice.width}" height="${lattice.height.toFixed(2)}">${latticeGround("cell", lattice)}</mask></defs>
    ${shown.length ? `<g mask="url(#mosaic)">${areas}</g>${legend}`
      : `${latticeGround("cell", lattice)}<text class="label" x="${PAD}" y="153">No language data yet.</text>`}`,
  });
}
