#!/usr/bin/env node
// Rasterises assets/brand/*.svg to PNG with the real Relay Labs faces
// (Archivo, Instrument Serif, IBM Plex Mono via Google Fonts). Needs network
// and Playwright's Chromium (CHROME=/path/to/chrome to use another binary).
// Not part of the plugin — it only regenerates the committed brand PNGs.
//
//   node scripts/render-brand.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

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

const B = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "brand");
const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=block";

const JOBS = [
  { svg: "docs-autopilot-icon.svg", out: "docs-autopilot-icon.png", w: 512, h: 512 },
  { svg: "docs-autopilot-lockup.svg", out: "docs-autopilot-lockup.png", w: 640, h: 72, scale: 2, transparent: true },
  { svg: "docs-autopilot-lockup-on-dark.svg", out: "docs-autopilot-lockup-on-dark.png", w: 640, h: 72, scale: 2 },
  { svg: "social-preview.svg", out: "social-preview.png", w: 1280, h: 640 },
  // Agensi / Open Graph cover: same artwork letterboxed on paper at 1200×630.
  { svg: "social-preview.svg", out: "agensi-cover.png", w: 1200, h: 630, bg: "#F4F1E9" },
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
      `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}">` +
        `<style>html,body{margin:0;background:${job.bg ?? "transparent"}}svg{display:block;width:${job.w}px;height:${job.h}px}</style>` +
        `</head><body>${svg}</body></html>`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(B, job.out), omitBackground: Boolean(job.transparent) });
    await page.close();
    console.log(`→ assets/brand/${job.out}`);
  }
} finally {
  await browser.close();
}
