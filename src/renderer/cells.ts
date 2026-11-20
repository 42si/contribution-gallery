/**
 * Drawing in contribution cells.
 *
 * The graph is seven rows tall, one per weekday, so the gallery's lettering
 * is too: a 5 × 7 face whose every dot is a contribution cell. Numbers set
 * in it read as if they had been written into the graph, one day at a time.
 */

export const ROWS = 7;

/** Rows top to bottom; "1" is a lit cell, "2" a second tone where a glyph has one */
const GLYPHS: Record<string, string[]> = {
  "0": [".111.", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."],
  "1": ["..1..", ".11..", "..1..", "..1..", "..1..", "..1..", ".111."],
  "2": [".111.", "1...1", "....1", "...1.", "..1..", ".1...", "11111"],
  "3": [".111.", "1...1", "....1", "..11.", "....1", "1...1", ".111."],
  "4": ["...1.", "..11.", ".1.1.", "1..1.", "11111", "...1.", "...1."],
  "5": ["11111", "1....", "1111.", "....1", "....1", "1...1", ".111."],
  "6": [".111.", "1...1", "1....", "1111.", "1...1", "1...1", ".111."],
  "7": ["11111", "....1", "...1.", "..1..", ".1...", ".1...", ".1..."],
  "8": [".111.", "1...1", "1...1", ".111.", "1...1", "1...1", ".111."],
  "9": [".111.", "1...1", "1...1", ".1111", "....1", "1...1", ".111."],
  ",": ["..", "..", "..", "..", "..", ".1", "1."],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
  A: [".111.", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"],
  D: ["1111.", "1...1", "1...1", "1...1", "1...1", "1...1", "1111."],
  S: [".1111", "1....", "1....", ".111.", "....1", "....1", "1111."],
  Y: ["1...1", "1...1", ".1.1.", "..1..", "..1..", "..1..", "..1.."],
  // A flame, with a hotter core
  "*": ["..1..", "..11.", ".111.", ".1211", "11221", "12221", ".121."],
};

export interface LitCell {
  col: number;
  row: number;
  /** "1" or "2", as drawn in the glyph */
  tone: string;
  /** The character this cell belongs to */
  char: string;
}

/** Lay a string out on the lattice, one empty column between glyphs */
export function setInCells(text: string): { cols: number; cells: LitCell[] } {
  const cells: LitCell[] = [];
  let col = 0;
  for (const char of text) {
    const glyph = GLYPHS[char];
    if (!glyph) continue;
    glyph.forEach((line, row) => [...line].forEach((tone, dx) => {
      if (tone !== ".") cells.push({ col: col + dx, row, tone, char });
    }));
    col += glyph[0].length + 1;
  }
  return { cols: Math.max(col - 1, 0), cells };
}

export interface Lattice {
  /** Top-left corner of the first cell */
  x: number;
  y: number;
  cols: number;
  /** Distance between neighbouring cells, and the size of one */
  pitch: number;
  cell: number;
  radius: number;
  width: number;
  height: number;
}

/** A seven-row lattice of `cols` columns at a given pitch */
export function latticeOf(x: number, y: number, cols: number, pitch: number): Lattice {
  // Cells keep the graph's proportions: 11 parts square to 3 parts gap
  const cell = pitch * 11 / 14;
  return { x, y, cols, pitch, cell, radius: cell * 0.24, width: cols * pitch - (pitch - cell), height: ROWS * pitch - (pitch - cell) };
}

/** A seven-row lattice of `cols` columns that spans exactly `width` */
export function latticeAcross(x: number, y: number, width: number, cols: number): Lattice {
  return latticeOf(x, y, cols, width / (cols - 3 / 14));
}

const n = (value: number) => parseFloat(value.toFixed(2)).toString();

/**
 * Shared definitions for a lattice: one cell to stamp with <use>, and a
 * tile that paints every unlit cell with a single rectangle.
 */
export function latticeDefs(id: string, l: Lattice, unlit: string): string {
  return `<rect id="${id}" width="${n(l.cell)}" height="${n(l.cell)}" rx="${n(l.radius)}"/>` +
    `<pattern id="${id}-tile" patternUnits="userSpaceOnUse" x="${n(l.x)}" y="${n(l.y)}" width="${n(l.pitch)}" height="${n(l.pitch)}">` +
    `<rect width="${n(l.cell)}" height="${n(l.cell)}" rx="${n(l.radius)}" fill="${unlit}"/></pattern>`;
}

/** Every cell of the lattice, unlit */
export function latticeGround(id: string, l: Lattice): string {
  return `<rect x="${n(l.x)}" y="${n(l.y)}" width="${n(l.width)}" height="${n(l.height)}" fill="url(#${id}-tile)"/>`;
}

/** One lit cell, stamped from the lattice's shared shape */
export function stamp(id: string, l: Lattice, col: number, row: number, attributes: string): string {
  return `<use href="#${id}" x="${n(l.x + col * l.pitch)}" y="${n(l.y + row * l.pitch)}" ${attributes}/>`;
}

/**
 * Writes the lit cells on from the left, a column at a time, once on load.
 * The clip rests at full width, so a still render shows everything.
 */
export function writeOn(id: string, l: Lattice, delay: number, perColumn = 0.022): string {
  const widths = Array.from({ length: l.cols + 1 }, (_, col) => n(col === l.cols ? l.width + 2 : col * l.pitch));
  const dur = delay + l.cols * perColumn;
  const times = widths.map((_, col) => ((delay + col * perColumn) / dur).toFixed(4));
  return `<clipPath id="${id}"><rect x="${n(l.x - 1)}" y="${n(l.y - 1)}" width="${n(l.width + 2)}" height="${n(l.height + 2)}">` +
    `<animate attributeName="width" values="0;${widths.join(";")}" keyTimes="0;${times.join(";")}" calcMode="discrete" dur="${n(dur)}s" fill="freeze"/></rect></clipPath>`;
}

/** Small pixel emblems: `rows` of "." and tone characters, painted by `fill` */
export function emblem(rows: string[], x: number, y: number, pitch: number, size: number,
  paint: (tone: string, col: number, row: number) => string): string {
  return rows.flatMap((line, row) => [...line].map((tone, col) => tone === "." ? "" :
    `<rect x="${n(x + col * pitch)}" y="${n(y + row * pitch)}" width="${n(size)}" height="${n(size)}" rx="${n(size * 0.26)}" ${paint(tone, col, row)}/>`
  )).join("");
}
