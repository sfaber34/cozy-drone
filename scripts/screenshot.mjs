// Interactive Steam-screenshot capture.
//
// Opens the game in a real (visible) Chrome window sized to an exact pixel
// viewport via Puppeteer/CDP. Fly the drone normally like any playtest —
// when you see a good shot, press 'p' to save a PNG. 'p' is unbound in the
// game's own controls (WASD/E/Q/space/1-2-3/R), so it's safe to claim as a
// global capture key. Enter in this terminal also works, as a fallback.
//
// Captures come from page.screenshot() (Chrome DevTools Protocol), which
// rasterizes the rendered page itself — not the OS window — so there's no
// title bar, no frame, and no rounded corners in the output, regardless of
// headless/headed mode. Every capture is exactly width*scale x height*scale
// pixels, so a whole shoot comes out consistently sized.
//
// Prereqs: `npm run dev` running in another terminal (default localhost:5173).
//
// Usage:
//   node scripts/screenshot.mjs [--width=3840] [--height=1240] [--scale=1] [--url=http://localhost:5173] [--out=screenshots]

import puppeteer from "puppeteer";
import readline from "node:readline";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

function arg(name, def) {
  const match = process.argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : def;
}

const width = Number(arg("width", 3840));
const height = Number(arg("height", 1240));
const deviceScaleFactor = Number(arg("scale", 1));
const url = arg("url", "http://localhost:5173");
const outDir = arg("out", "screenshots");

await mkdir(outDir, { recursive: true });

// Resume numbering after the highest existing shot-NN.png so a restart never
// clobbers screenshots from an earlier session.
async function nextShotNum() {
  const entries = await readdir(outDir);
  let max = 0;
  for (const entry of entries) {
    const match = entry.match(/^shot-(\d+)\.png$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width, height, deviceScaleFactor },
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor });

let shotNum = await nextShotNum();
async function capture() {
  const filename = `shot-${String(shotNum).padStart(2, "0")}.png`;
  const filePath = path.join(outDir, filename);
  await page.screenshot({ path: filePath });
  console.log(`Saved ${filePath}`);
  shotNum++;
}

// Exposed once per page instance; persisted across reloads via
// exposeFunction (survives navigation) + evaluateOnNewDocument (re-attaches
// the listener on every fresh document, including the very first load).
await page.exposeFunction("__captureScreenshot", capture);
await page.evaluateOnNewDocument(() => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") window.__captureScreenshot();
  });
});

await page.goto(url, { waitUntil: "networkidle0" });

const outW = width * deviceScaleFactor;
const outH = height * deviceScaleFactor;
console.log(
  `\nGame open at ${width}x${height} viewport (scale ${deviceScaleFactor}x -> ${outW}x${outH} PNG output).`,
);
console.log(
  "Play normally in the browser window. Press 'p' in-game (or Enter here) to capture a screenshot, Ctrl+C to quit.\n",
);

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", capture);

browser.on("disconnected", () => process.exit(0));
