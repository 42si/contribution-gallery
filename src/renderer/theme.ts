import display from "./fonts/display.json";
import { NumeralFont, numeralCss, numeralLicense } from "./numerals";
import { DARK_SPECTRUM, LIGHT_SPECTRUM, Spectrum } from "./scenes/kit";
import { DisplaySubset } from "./titles";

/**
 * Shared visual language for the gallery's self-contained SVGs.
 *
 * One idea runs through every card: the picture is drawn in contribution
 * cells — the same rounded square on a seven-row lattice as the graph —
 * and the words around it are set quietly, like a wall label. Titles are
 * the one place the type speaks up, in an italic serif.
 */
export const CARD_WIDTH = 753;
export const HALF_WIDTH = 375;
export const HALF_HEIGHT = 256;
/** Left and right padding shared by every card */
export const PAD = 24;

export interface GalleryTheme {
  dark: boolean;
  /** The host page's canvas, so a card sits flush in a README */
  background: string;
  /** An unlit cell */
  inset: string;
  border: string;
  text: string;
  muted: string;
  /** Tertiary marks only; too quiet for small text */
  faint: string;
  /** Contribution greens, quietest first */
  greens: [string, string, string, string];
  /** Cell numerals lit in green: top row to bottom row */
  lit: [string, string];
  /** Flame rows: white-hot tip down to the ember bed */
  flame: string[];
  /** The hues every scene and pixel emblem draws from */
  spectrum: Spectrum;
}

export function galleryTheme(dark: boolean): GalleryTheme {
  return dark
    ? {
        dark, background: "#0d1117", inset: "#161b22", border: "#262e3a",
        text: "#e6edf3", muted: "#919dab", faint: "#55616f",
        greens: ["#0e4429", "#006d32", "#26a641", "#39d353"],
        lit: ["#7ee787", "#2ea043"],
        flame: ["#fff3b8", "#ffe07a", "#ffc65a", "#ffa94d", "#ff8c42", "#f76f36", "#e2552b"],
        spectrum: DARK_SPECTRUM,
      }
    : {
        dark, background: "#ffffff", inset: "#ebedf0", border: "#d8dee4",
        text: "#1f2328", muted: "#59636e", faint: "#a3acb5",
        greens: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
        lit: ["#2da44e", "#1a7f37"],
        flame: ["#eda100", "#ea8d09", "#e67a12", "#e06719", "#d6541e", "#c74321", "#b03520"],
        spectrum: LIGHT_SPECTRUM,
      };
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function number(value: number): string {
  return value.toLocaleString("en-US");
}

/** Keep unusually large totals inside their column without losing precision. */
export function numberSize(value: string, preferred: number, width: number): number {
  return Math.min(preferred, width / (value.length * 0.63));
}

/** The display face, subset to the letters of one card's titles */
export function displayCss(subset: DisplaySubset): string {
  return `@font-face{font-family:'Gallery ${display.family}';font-style:italic;font-weight:500;src:url(data:font/ttf;base64,${display.subsets[subset].data}) format('truetype')}
    .title{font-family:'Gallery ${display.family}',ui-serif,Georgia,'Times New Roman',serif;font-style:italic;font-weight:500;font-size:22px;fill:currentColor}`;
}

/** Letters the embedded display subset can draw */
export function displayGlyphs(subset: DisplaySubset): string {
  return display.subsets[subset].text;
}

/**
 * Copyright notices of every embedded font, followed by one copy of the
 * SIL Open Font License they share.
 */
export function fontLicenses(font: NumeralFont): string {
  const split = (license: string): [string, string] => {
    const at = license.indexOf("\n\n");
    return [license.slice(0, at), license.slice(at + 2)];
  };
  const licenses = [display.license, numeralLicense(font)].filter(Boolean).map(split);
  return `${licenses.map((l) => l[0]).join("\n")}\n\n${licenses[0][1]}`;
}

export function galleryCss(theme: GalleryTheme, subset: DisplaySubset, font: NumeralFont = "mono"): string {
  return `text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;fill:${theme.text}}
    ${displayCss(subset)}
    .label{font-size:12px;font-weight:500}
    .detail{font-size:11px;fill:${theme.muted}}
    ${numeralCss(font)}
    .number{fill:${theme.text}}`;
}

export function cardSurface(width: number, height: number, theme: GalleryTheme): string {
  return `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="14" fill="${theme.background}" stroke="${theme.border}"/>`;
}

export interface Card {
  /** Accessible name and long description */
  label: string;
  description: string;
  width: number;
  height: number;
  theme: GalleryTheme;
  /** Which display subset the card's title is set in */
  subset: DisplaySubset;
  font?: NumeralFont;
  css?: string;
  body: string;
}

export function cardSvg({ label, description, width, height, theme, subset, font = "mono", css = "", body }: Card): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description" color="${theme.text}" data-design="gallery-v6" data-numeral-font="${font}">
  <title id="title">${escapeXml(label)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <metadata id="font-license">${escapeXml(fontLicenses(font))}</metadata>
  <style>${galleryCss(theme, subset, font)}${css}</style>
  ${cardSurface(width, height, theme)}
  ${body}
</svg>\n`;
}

/** A card's heading row: the title, and one quiet line saying what is measured */
export function cardHeader(title: string, note: string, width: number): string {
  return `<text class="title" x="${PAD}" y="41">${escapeXml(title)}</text>
    <text class="detail" x="${width - PAD}" y="40" text-anchor="end">${escapeXml(note)}</text>`;
}
