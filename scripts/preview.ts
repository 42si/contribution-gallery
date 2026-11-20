import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { renderAmbientSVG } from "../src/renderer/ambient";
import { renderStatsSVG } from "../src/renderer/stats";
import { renderLangsSVG } from "../src/renderer/langs";
import { renderStreakSVG } from "../src/renderer/streak";
import { renderTrophySVG } from "../src/renderer/trophy";
import { NumeralFont, resolveNumeralFont } from "../src/renderer/numerals";
import { displayCss, galleryTheme } from "../src/renderer/theme";
import display from "../src/renderer/fonts/display.json";
import { Grid, UserStats, DEFAULT_RENDER_CONFIG, DEFAULT_DARK_PALETTE, DEFAULT_LIGHT_PALETTE } from "../src/types";

// Use the checked-in snapshot. Previewing and regenerating examples need no token.
const grid: Grid = JSON.parse(readFileSync("docs/grid.json", "utf8"));
const stats: UserStats = JSON.parse(readFileSync("docs/stats.json", "utf8"));
const seed = 20260907;
const config = (dark: boolean) => ({ ...DEFAULT_RENDER_CONFIG, darkMode: dark,
  palette: dark ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE });
const renderers: Record<string, (dark: boolean, font?: NumeralFont) => string> = {
  ambient: dark => renderAmbientSVG(grid, config(dark), seed),
  stats: (dark, font) => renderStatsSVG(stats, dark, font),
  langs: (dark, font) => renderLangsSVG(stats, dark, font),
  streak: (dark, font) => renderStreakSVG(stats, dark, font),
  trophy: (dark, font) => renderTrophySVG(stats, dark, font),
};

if (process.argv.includes("--write")) {
  for (const name of ["ambient"]) {
    for (const dark of [false, true]) {
      const path = `docs/${name}${dark ? "-dark" : ""}.svg`;
      writeFileSync(path, renderers[name](dark));
      console.log(`Rendered ${path}`);
    }
  }
} else {
  const port = Number(process.env.PORT ?? 4173);
  createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const dark = url.searchParams.get("theme") !== "light";
    const font = resolveNumeralFont(url.searchParams.get("font"));
    const name = url.pathname.replace("/api/", "");
    res.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204).end();
      return;
    }
    if (url.pathname.startsWith("/api/") && Object.hasOwnProperty.call(renderers, name)) {
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.end(renderers[name](dark, font));
      return;
    }
    if (url.pathname !== "/") {
      res.writeHead(404).end("Not found");
      return;
    }
    const mode = dark ? "dark" : "light";
    const theme = galleryTheme(dark);
    const img = (name: string) => `<img src="/api/${name}?theme=${mode}&amp;font=${font}" alt="${name} card">`;
    const current = (on: boolean) => (on ? ' aria-current="true"' : "");
    const choices = [["inter", "Inter"], ["outfit", "Outfit"], ["space", "Space Grotesk"], ["mono", "System mono"]]
      .map(([id, label]) => `<a href="/?theme=${mode}&amp;font=${id}"${current(font === id)}>${label}</a>`).join("");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Contribution gallery preview</title>
      <style>${displayCss("ambient")}
      :root{color-scheme:${mode}}*{box-sizing:border-box}
      body{margin:0;background:${theme.background};color:${theme.muted};font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif}
      header,main{max-width:801px;margin:0 auto;padding:0 24px}
      header{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:36px;padding-bottom:20px}
      h1{margin:0;font:italic 500 26px 'Gallery ${display.family}',ui-serif,Georgia,serif;color:${theme.text}}
      nav{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
      nav span{margin-right:8px}
      a{color:inherit;text-decoration:none;padding:5px 10px;border-radius:7px}
      a:hover{color:${theme.text}}
      a:focus-visible{outline:2px solid ${theme.lit[0]};outline-offset:1px}
      a[aria-current]{color:${theme.text};background:${theme.inset}}
      .options{display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;margin-bottom:20px}
      article{display:flex;flex-direction:column;gap:12px}img{display:block;width:100%;height:auto}
      .pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      footer{margin:20px 0 48px}
      @media(max-width:540px){header,main{padding-left:16px;padding-right:16px}.pair{grid-template-columns:1fr}}</style></head>
      <body><header><h1>Contribution gallery</h1><nav aria-label="Theme"><a href="/?theme=dark&amp;font=${font}"${current(dark)}>Dark</a><a href="/?theme=light&amp;font=${font}"${current(!dark)}>Light</a></nav></header>
      <main><div class="options"><nav aria-label="Numerals"><span>Numerals</span>${choices}</nav></div>
      <article>${img("ambient")}<div class="pair">${img("stats")}${img("langs")}</div>${img("streak")}${img("trophy")}</article>
      <footer>Drawn from the contribution data saved in docs/. Each card is one self-contained SVG, as GitHub will serve it.</footer></main></body></html>`);
  }).listen(port, "127.0.0.1", () => console.log(`Gallery preview: http://127.0.0.1:${port}`));
}
