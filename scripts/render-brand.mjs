#!/usr/bin/env node
// Composes and rasterises the brand assets in assets/brand/.
//
//   node scripts/render-brand.mjs
//
// 1. assets/brand/src/social-preview.svg → assets/brand/social-preview.svg, with
//    {{LOCKUP_BLUE}} replaced by the supplied Relay Labs lockup
//    (assets/brand/relay-labs/relay-labs-lockup-blue.svg) so the wordmark is
//    placed, never retyped.
// 2. Every SVG → PNG through Chromium (Playwright). Type is the brand stack —
//    Helvetica Neue → Helvetica → Arial — with Liberation Sans (Arial-metric)
//    as the Linux fallback; no webfonts are loaded.
//
// Needs Playwright's Chromium (CHROME=/path/to/chrome to use another binary).
// Not part of the plugin; it only regenerates the committed brand files.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const B = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "brand");

// Playwright may be installed locally or globally; try both.
const require = createRequire(import.meta.url);
function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    return require(path.join(globalRoot, "playwright"));
  }
}
const { chromium } = loadPlaywright();

/** The supplied lockup's drawing, as a positioned group. The file carries a C2PA
 *  <metadata> block; only the artwork is placed. */
function suppliedLockup(file, x, y, h) {
  const svg = fs.readFileSync(path.join(B, "relay-labs", file), "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, "");
  const vb = /viewBox="([\d.\s]+)"/.exec(svg)[1].split(/\s+/).map(Number);
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const s = h / vb[3];
  return `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
}

// 1. Compose.
const social = fs
  .readFileSync(path.join(B, "src", "social-preview.svg"), "utf8")
  .replaceAll("{{LOCKUP_BLUE}}", suppliedLockup("relay-labs-lockup-blue.svg", 72, 560, 28));
fs.writeFileSync(path.join(B, "social-preview.svg"), social);
console.log("→ assets/brand/social-preview.svg (composed)");

// 2. Rasterise.
const JOBS = [
  { svg: "docs-autopilot-icon.svg", out: "docs-autopilot-icon.png", w: 512, h: 512 },
  { svg: "docs-autopilot-lockup.svg", out: "docs-autopilot-lockup.png", w: 640, h: 72, scale: 2, transparent: true },
  { svg: "docs-autopilot-lockup-paper.svg", out: "docs-autopilot-lockup-paper.png", w: 640, h: 72, scale: 2 },
  { svg: "docs-autopilot-lockup-ink.svg", out: "docs-autopilot-lockup-ink.png", w: 640, h: 72, scale: 2 },
  { svg: "social-preview.svg", out: "social-preview.png", w: 1280, h: 640 },
  // Agensi / Open Graph cover: same artwork letterboxed on Paper at 1200×630.
  { svg: "social-preview.svg", out: "agensi-cover.png", w: 1200, h: 630, bg: "#FAFAF8" },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ["--no-sandbox"],
});
try {
  for (const job of JOBS) {
    const page = await browser.newPage({
      viewport: { width: job.w, height: job.h },
      deviceScaleFactor: job.scale ?? 1,
    });
    const svg = fs.readFileSync(path.join(B, job.svg), "utf8");
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">` +
        `<style>html,body{margin:0;background:${job.bg ?? "transparent"}}svg{display:block;width:${job.w}px;height:${job.h}px}</style>` +
        `</head><body>${svg}</body></html>`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(B, job.out), omitBackground: Boolean(job.transparent) });
    await page.close();
    console.log(`→ assets/brand/${job.out}`);
  }
} finally {
  await browser.close();
}
