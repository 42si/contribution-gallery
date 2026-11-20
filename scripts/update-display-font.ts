import { writeFileSync } from "node:fs";
import { SCENES } from "../src/renderer/scenes";
import { CARD_TITLES, DisplaySubset, STILL_TITLE } from "../src/renderer/titles";

// Titles are set in Fraunces Italic. GitHub image embeds cannot load remote
// fonts, so each SVG carries a static subset holding only the letters of its
// own titles: a few kilobytes for the ambient card, less for the others.
const family = "Fraunces";
// Soft serifs echo the rounded cells; the 72pt optical size stays sturdy at 20–26px
const axes = "ital,opsz,wght,SOFT,WONK@1,72,500,100,0";
const revision = "5e35378e6bda803962ee6fd257e444a7d459660d";
const destination = "src/renderer/fonts";

const texts: Record<DisplaySubset, string[]> = {
  ambient: [...SCENES.map((scene) => scene.title), STILL_TITLE],
  stats: [CARD_TITLES.stats],
  langs: [CARD_TITLES.langs],
  streak: [CARD_TITLES.streak],
  trophy: [CARD_TITLES.trophy],
};

async function download(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}

async function main() {
  const subsets: Record<string, { text: string; data: string }> = {};
  for (const [id, strings] of Object.entries(texts)) {
    const text = [...new Set(strings.join(""))].sort().join("");
    const cssUrl = new URL("https://fonts.googleapis.com/css2");
    cssUrl.searchParams.set("family", `${family}:${axes}`);
    cssUrl.searchParams.set("text", text);
    const css = await (await download(cssUrl.toString())).text();
    const matches = [...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/g)];
    if (matches.length !== 1) throw new Error(`Expected one static TrueType font for "${id}"`);
    const bytes = Buffer.from(await (await download(matches[0][1])).arrayBuffer());
    if (bytes.readUInt32BE(0) !== 0x00010000) throw new Error(`Invalid TrueType font: ${id}`);
    subsets[id] = { text, data: bytes.toString("base64") };
    console.log(`${id}: "${text}" ${bytes.length} bytes`);
  }
  const license = (await (await download(`https://raw.githubusercontent.com/google/fonts/${revision}/ofl/fraunces/OFL.txt`)).text())
    .replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd() + "\n";
  writeFileSync(`${destination}/fraunces-OFL.txt`, license);
  writeFileSync(`${destination}/display.json`, JSON.stringify({ family, axes, license, subsets }, null, 2) + "\n");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
