import { CellOwner, Grid, UserStats, DEFAULT_RENDER_CONFIG, DEFAULT_DARK_PALETTE } from "../types";
import { renderAmbientSVG } from "./ambient";
import { renderStatsSVG } from "./stats";
import { apportion, renderLangsSVG } from "./langs";
import { renderStreakSVG } from "./streak";
import { renderTrophySVG } from "./trophy";
import { SCENES, SCENE_SECONDS } from "./scenes";
import { displayGlyphs } from "./theme";
import { CARD_TITLES, DisplaySubset, STILL_TITLE } from "./titles";

const stats: UserStats = {
  login: "test", generatedAt: "2026-09-07T00:00:00Z", totalContributions: 12345,
  firstContribution: "2020-01-01", commits: 4000, followers: 0, stars: 200,
  repos: 30, pullRequests: 1000, issues: 40, reviews: 8,
  currentStreak: { days: 285, start: "2025-11-26", end: "2026-09-06" },
  longestStreak: { days: 285, start: "2025-11-26", end: "2026-09-06" },
  languages: [{ name: "C++", color: "#f34b7d", size: 3 }, { name: "C", color: "#555555", size: 1 }],
};

/** Every line of text on a card in document order: what a visitor, or a screen reader, is told */
const reading = (svg: string) => [...svg.matchAll(/<(title|desc|text)\b[^>]*>([\s\S]*?)<\/\1>/g)]
  .map(m => m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);

/** The lit cells of a card's lattice, drawn as text */
const drawn = (svg: string) => {
  const [x0, y0, pitch] = /<pattern id="cell-tile"[^>]*? x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/.exec(svg)!.slice(1).map(Number);
  const lit = new Set([...svg.matchAll(/<use href="#cell" x="([\d.]+)" y="([\d.]+)"/g)]
    .map(m => `${Math.round((Number(m[1]) - x0) / pitch)},${Math.round((Number(m[2]) - y0) / pitch)}`));
  const cols = Math.max(...[...lit].map(at => Number(at.split(",")[0]))) + 2;
  return Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (lit.has(`${col},${row}`) ? "#" : ".")).join("")).join("\n");
};

/** The root element: size, accessible wiring and design markers */
const frame = (svg: string) => svg.slice(0, svg.indexOf(">") + 1);

/** What the card does for a viewer who asked for less motion */
const withoutMotion = (svg: string) => /@media\(prefers-reduced-motion:reduce\)\{(?:[^{}]|\{[^{}]*\})*\}/.exec(svg)?.[0];

test.each([false, true])("cards are self-contained images with nothing broken inside (dark=%s)", dark => {
  for (const render of [renderStatsSVG, renderLangsSVG, renderStreakSVG, renderTrophySVG]) {
    const svg = render(stats, dark);
    expect(svg).not.toMatch(/NaN|Infinity|undefined/);
    expect(svg).not.toMatch(/<script|<foreignObject|(?:href|src)\s*=\s*["']https?:\/\/|url\(\s*["']?https?:\/\//);
  }
});

test("each card declares its size, its accessible name and a reduced-motion rule", () => {
  const cards = [renderStatsSVG, renderLangsSVG, renderStreakSVG, renderTrophySVG].map(render => render(stats, true));
  expect(cards.map(svg => `${frame(svg)}\n${withoutMotion(svg)}`).join("\n\n")).toMatchInlineSnapshot(`
"<svg xmlns="http://www.w3.org/2000/svg" width="375" height="256" viewBox="0 0 375 256" role="img" aria-labelledby="title description" color="#e6edf3" data-design="gallery-v6" data-numeral-font="inter">
@media(prefers-reduced-motion:reduce){.lit,.emblem{animation:none;opacity:1}}

<svg xmlns="http://www.w3.org/2000/svg" width="375" height="256" viewBox="0 0 375 256" role="img" aria-labelledby="title description" color="#e6edf3" data-design="gallery-v6" data-numeral-font="inter">
@media(prefers-reduced-motion:reduce){.share,.swatch{animation:none}}

<svg xmlns="http://www.w3.org/2000/svg" width="753" height="172" viewBox="0 0 753 172" role="img" aria-labelledby="title description" color="#e6edf3" data-design="gallery-v6" data-numeral-font="inter">
@media(prefers-reduced-motion:reduce){.fl{animation:none}.ember{display:none}}

<svg xmlns="http://www.w3.org/2000/svg" width="753" height="194" viewBox="0 0 753 194" role="img" aria-labelledby="title description" color="#e6edf3" data-design="gallery-v6" data-numeral-font="inter">
@media(prefers-reduced-motion:reduce){.shine{animation:none}.spark{animation:none;opacity:.6}}"
`);
});

test("every title can be set in the display face embedded in its card", () => {
  const titles: Record<DisplaySubset, string[]> = {
    ambient: [...SCENES.map(scene => scene.title), STILL_TITLE],
    stats: [CARD_TITLES.stats], langs: [CARD_TITLES.langs], streak: [CARD_TITLES.streak], trophy: [CARD_TITLES.trophy],
  };
  const missing = Object.entries(titles).map(([subset, strings]) =>
    [subset, [...new Set(strings.join(""))].filter(letter => !displayGlyphs(subset as DisplaySubset).includes(letter)).join("")]);
  // A letter listed here would fall back to the system serif: run scripts/update-display-font.ts
  expect(Object.fromEntries(missing)).toMatchInlineSnapshot(`
{
  "ambient": "",
  "langs": "",
  "stats": "",
  "streak": "",
  "trophy": "",
}
`);
});

test("activity writes the commit total in cells above its four supporting totals", () => {
  const svg = renderStatsSVG(stats, true);
  expect(drawn(svg)).toMatchInlineSnapshot(`
"....#......###...###...###..
...##.....#...#.#...#.#...#.
..#.#.....#...#.#...#.#...#.
.#..#.....#...#.#...#.#...#.
.#####....#...#.#...#.#...#.
....#...#.#...#.#...#.#...#.
....#..#...###...###...###.."
`);
  expect(reading(svg)).toMatchInlineSnapshot(`
[
  "GitHub activity",
  "test: 4,000 commits, 200 stars earned, 1,000 pull requests, 40 issues opened, 0 followers. All-time totals.",
  "Activity",
  "since January 2020",
  "commits",
  "200",
  "Stars",
  "1,000",
  "Pull requests",
  "40",
  "Issues",
  "0",
  "Followers",
]
`);
});

test("languages share the mosaic in proportion and empty data never divides by zero", () => {
  const svg = renderLangsSVG(stats, true);
  expect([...svg.matchAll(/data-language="([^"]+)" data-cells="(\d+)"/g)].map(m => `${m[1]}: ${m[2]} cells`)).toMatchInlineSnapshot(`
[
  "C++: 179 cells",
  "C: 59 cells",
]
`);
  expect(reading(svg)).toMatchInlineSnapshot(`
[
  "Language composition",
  "C++ 75.0%, C 25.0%. Shares of indexed code by byte size.",
  "Languages",
  "share of code, by size",
  "C++",
  "75.0%",
  "C++",
  "C",
  "25.0%",
  "C",
]
`);
  const empty = [[], [{ name: "Empty", size: 0, color: null }]].map(languages => renderLangsSVG({ ...stats, languages }, true));
  expect(empty.map(reading)).toMatchInlineSnapshot(`
[
  [
    "Language composition",
    "No language data yet. Shares of indexed code by byte size.",
    "Languages",
    "share of code, by size",
    "No language data yet.",
  ],
  [
    "Language composition",
    "No language data yet. Shares of indexed code by byte size.",
    "Languages",
    "share of code, by size",
    "No language data yet.",
  ],
]
`);
  for (const svg of empty) expect(svg).not.toMatch(/NaN|Infinity/);
});

test("cells are shared out by largest remainder, and no language is left without one", () => {
  const shares = [[[3, 1], 35], [[1, 1, 1], 238], [[1000, 1, 1], 238], [[5, 0], 10], [[], 238]] as [number[], number][];
  expect(shares.map(([sizes, cells]) => `${JSON.stringify(sizes)} over ${cells} cells: ${JSON.stringify(apportion(sizes, cells))}`)).toMatchInlineSnapshot(`
[
  "[3,1] over 35 cells: [26,9]",
  "[1,1,1] over 238 cells: [80,79,79]",
  "[1000,1,1] over 238 cells: [236,1,1]",
  "[5,0] over 10 cells: [10,0]",
  "[] over 238 cells: []",
]
`);
  for (const sizes of [[3, 1], [7, 5, 3, 2, 1, 1], [1000, 1, 1, 1, 1, 1, 1, 1, 1, 1]]) {
    expect(apportion(sizes, 238).reduce((sum, count) => sum + count, 0)).toBe(238);
  }
});

test("external language names and profile names are XML escaped", () => {
  const custom = { ...stats, login: 'user<&"', languages: [{ name: 'A<&"', color: null, size: 1 }] };
  expect(reading(renderLangsSVG(custom, true))).toMatchInlineSnapshot(`
[
  "Language composition",
  "A&lt;&amp;&quot; 100.0%. Shares of indexed code by byte size.",
  "Languages",
  "share of code, by size",
  "A&lt;&amp;&quot;",
  "100.0%",
  "A&lt;&amp;&quot;",
]
`);
  expect(reading(renderStatsSVG(custom, true))[1]).toMatchInlineSnapshot(`"user&lt;&amp;&quot;: 4,000 commits, 200 stars earned, 1,000 pull requests, 40 issues opened, 0 followers. All-time totals."`);
});

test("a running streak burns in cells beside its flame, with both years in its dates", () => {
  const svg = renderStreakSVG(stats, true);
  expect(drawn(svg)).toMatchInlineSnapshot(`
"..###...###..#####......#...
.#...#.#...#.#..........##..
.....#.#...#.####......###..
....#...###......#.....####.
...#...#...#.....#....#####.
..#....#...#.#...#....#####.
.#####..###...###......###.."
`);
  expect(reading(svg)).toMatchInlineSnapshot(`
[
  "Contribution streaks",
  "12,345 total contributions. Current streak: 285 days. Longest streak: 285 days.",
  "Streak",
  "consecutive days with a contribution",
  "days in a row Nov 26, 2025 – Sep 6, 2026",
  "Longest streak",
  "285 days",
  "This one, and still going",
  "Total contributions",
  "12,345",
  "Since Jan 1, 2020",
]
`);
});

test("a broken streak is an unlit zero with no flame", () => {
  const svg = renderStreakSVG({ ...stats, currentStreak: { days: 0, start: "", end: "" } }, true);
  expect(drawn(svg)).toMatchInlineSnapshot(`
"..###..
.#...#.
.#...#.
.#...#.
.#...#.
.#...#.
..###.."
`);
  expect(reading(svg)).toMatchInlineSnapshot(`
[
  "Contribution streaks",
  "12,345 total contributions. Current streak: 0 days. Longest streak: 285 days.",
  "Streak",
  "consecutive days with a contribution",
  "A fresh start awaits",
  "Longest streak",
  "285 days",
  "Nov 26, 2025 – Sep 6, 2026",
  "Total contributions",
  "12,345",
  "Since Jan 1, 2020",
]
`);
  expect(svg).not.toMatch(/class="fl |class="ember"/);
});

test("milestones name each rank, the next one within reach, and unranked values", () => {
  expect(reading(renderTrophySVG(stats, true))).toMatchInlineSnapshot(`
[
  "GitHub milestones",
  "Commits: 4,000, SSS. Followers: 0, unranked. Stars: 200, S. Repos: 30, AAA. Pull requests: 1,000, SSS. Issues: 40, AA. Reviews: 8, B",
  "Milestones",
  "ranked from C up to SSS",
  "Commits: 4,000, rank SSS",
  "SSS",
  "4,000",
  "Commits",
  "Top rank",
  "Followers: 0, rank unranked",
  "—",
  "0",
  "Followers",
  "C at 1",
  "Stars: 200, rank S",
  "S",
  "200",
  "Stars",
  "SS at 700",
  "Repos: 30, rank AAA",
  "AAA",
  "30",
  "Repos",
  "S at 50",
  "Pull requests: 1,000, rank SSS",
  "SSS",
  "1,000",
  "Pull requests",
  "Top rank",
  "Issues: 40, rank AA",
  "AA",
  "40",
  "Issues",
  "AAA at 80",
  "Reviews: 8, rank B",
  "B",
  "8",
  "Reviews",
  "A at 20",
]
`);
  // One commit short of the top rank
  expect(reading(renderTrophySVG({ ...stats, commits: 3999 }, true)).slice(4, 9)).toMatchInlineSnapshot(`
[
  "Commits: 3,999, rank SS",
  "SS",
  "3,999",
  "Commits",
  "SSS at 4,000",
]
`);
});

test("ambient plays every scene over the original grid, which is all that remains without motion", () => {
  const grid: Grid = { width: 53, height: 7, cells: Array.from({ length: 53 }, (_, x) =>
    Array.from({ length: 7 }, (_, y) => ({ x, y, contributionLevel: 0, owner: CellOwner.None }))) };
  const config = { ...DEFAULT_RENDER_CONFIG, darkMode: true, palette: DEFAULT_DARK_PALETTE };
  const svg = renderAmbientSVG(grid, config, 42);
  expect(svg).toBe(renderAmbientSVG(grid, config, 42));
  expect(svg).not.toBe(renderAmbientSVG(grid, config, 43));
  const structure = {
    frame: frame(svg),
    withoutMotion: withoutMotion(svg),
    // The real graph stays underneath every scene
    graphCells: svg.match(/class="c b" /g)?.length,
    scenes: [...svg.matchAll(/data-scene="([^"]+)"/g)].map(m => m[1]),
    // Hidden without motion: the glow, the scene headings, the scenes and the progress cells
    live: [...svg.matchAll(/class="([^"]*\blive)"/g)].map(m => m[1]),
    bloom: /<use href="#scenes"[^>]*>/.exec(svg)?.[0],
    // Reveals are one-shot SMIL with a visible base state, so a still render keeps the graph
    reveals: svg.match(/<animate attributeName="opacity"[^>]*fill="freeze"\/>/g)?.length,
  };
  expect(structure).toMatchInlineSnapshot(`
{
  "bloom": "<use href="#scenes" filter="url(#bloom)" opacity=".7"/>",
  "frame": "<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 753 227" width="753" height="227" role="img" aria-labelledby="title description" color="#e6edf3" data-design="gallery-v6">",
  "graphCells": 371,
  "live": [
    "live",
    "scene-labels live",
    "ambient-scenes live",
    "scene-labels live",
  ],
  "reveals": 54,
  "scenes": [
    "plasma",
    "constellation",
    "aurora",
    "tide",
    "pong",
    "sort",
    "ripples",
    "life",
    "fireworks",
    "pathfinder",
  ],
  "withoutMotion": "@media(prefers-reduced-motion:reduce){.live{display:none}.still{display:inline}.c{animation:none!important}}",
}
`);
  expect(reading(svg)).toMatchInlineSnapshot(`
[
  "A year of contributions",
  "Contribution graph with an ambient animation — Plasma → Constellation → Aurora → Tide → Pong → Sort → Ripples → Life → Fireworks → Pathfinder, one scene every 15 seconds. 0 active days. Reduced motion shows the original contribution graph.",
  "Plasma",
  "Demoscene palette cycling, rolling across the year",
  "Constellation",
  "The busiest days, joined into a star chart",
  "Aurora",
  "Curtains of light drifting over the year",
  "Tide",
  "One long swell rolling from the first week to the last",
  "Pong",
  "The year plays itself at Pong",
  "Sort",
  "Weeks ranked by activity, sorted in parallel passes",
  "Ripples",
  "Rain on the days you showed up, rippling across the year",
  "Life",
  "Conway&apos;s Game of Life, seeded by the days you showed up",
  "Fireworks",
  "Your biggest weeks, launched into the night sky",
  "Pathfinder",
  "Breadth-first search through a maze, from the first day to the latest",
  "A year of contributions",
  "53 weeks, one cell for each day",
  "0 active days",
  "Less",
  "More",
]
`);
  expect(svg).not.toMatch(/from\{opacity:0\}|opacity="0">\s*<rect class="c b"/);
  expect(svg).not.toContain('class="month"');
  expect(svg).not.toMatch(/NaN|Infinity/);
});

test("ambient labels the months when the grid carries week dates", () => {
  const weekStarts = Array.from({ length: 53 }, (_, x) =>
    new Date(Date.UTC(2025, 8, 7) + x * 7 * 86_400_000).toISOString().slice(0, 10));
  const grid: Grid = { width: 53, height: 7, weekStarts, cells: Array.from({ length: 53 }, (_, x) =>
    Array.from({ length: 7 }, (_, y) => ({ x, y, contributionLevel: (x % 5) as 0 | 1 | 2 | 3 | 4, owner: CellOwner.None }))) };
  const svg = renderAmbientSVG(grid, DEFAULT_RENDER_CONFIG, 7);
  const months = [...svg.matchAll(/class="month" x="[\d.]+" y="\d+">(\w+)</g)].map(m => m[1]);
  expect(months).toEqual(["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]);
  // Life cells ramp between states instead of flipping, with a linear key list ending at 1
  expect(svg).toMatch(new RegExp(`values="0;0;1;[^"]*" keyTimes="0;0\\.\\d+;0\\.\\d+;[^"]*;1" dur="${SCENES.length * SCENE_SECONDS}s"`));
  expect(svg).not.toMatch(/NaN|Infinity|undefined/);
});
