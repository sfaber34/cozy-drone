// Renders every procedurally-generated texture in src/textures/*.js to PNG
// files under art-export/, plus a browsable index.html gallery.
//
// These generators normally run inside a live Phaser Scene in the browser
// (see BootScene.js). This script calls the exact same drawing code against
// a lightweight mock scene (mockScene.mjs, backed by node-canvas) so the
// pixels are byte-for-byte what the game actually renders.
//
// Usage:
//   node --experimental-loader ./scripts/exportArt/loader.mjs scripts/exportArt/run.mjs [--full-skins]
//   (or: npm run export-art [-- --full-skins])
//
// --full-skins exports all 200 procedural person skin variants instead of
// the default sample of 24 (the other ~8 poses per skin are almost all
// palette swaps of the same silhouette, so the full set is mostly useful
// for spot-checking color combinations rather than as an art reference).
//
// --scale=N overrides the upscale factor (default: the game's own SCALE
// constant, since that's the size these sprites actually render at
// on-screen — the raw textures are tiny, blurry-looking source pixel art
// otherwise).

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from 'canvas';
import { createMockScene } from './mockScene.mjs';
import { SCALE } from '../../src/constants.js';

import { generateDroneTextures } from '../../src/textures/droneTextures.js';
import { generatePersonTextures } from '../../src/textures/personTextures.js';
import { generateWorkerTextures } from '../../src/textures/workerTextures.js';
import { generateAnimalTextures } from '../../src/textures/animalTextures.js';
import { generateBuildingTextures } from '../../src/textures/buildingTextures.js';
import { generatePropTextures } from '../../src/textures/propTextures.js';
import { generateVehicleTextures } from '../../src/textures/vehicleTextures.js';
import { generateWeaponTextures } from '../../src/textures/weaponTextures.js';
import { generateWaterTextures } from '../../src/textures/waterTextures.js';
import { generateEffectTextures } from '../../src/textures/effectTextures.js';
import { generateMarketTextures } from '../../src/textures/marketTextures.js';
import { generateOilfieldTextures } from '../../src/textures/oilfieldTextures.js';
import { generateFarmFieldTextures } from '../../src/textures/farmFieldTextures.js';
import { generateFarmCompoundTextures } from '../../src/textures/farmCompoundTextures.js';
import { generateSoccerTextures } from '../../src/textures/soccerTextures.js';
import { generateChickenFightTextures } from '../../src/textures/chickenFightTextures.js';
import { generateCamelRaceTextures } from '../../src/textures/camelRaceTextures.js';
import { generateRockFightTextures } from '../../src/textures/rockFightTextures.js';
import { generateRockTargetTextures } from '../../src/textures/rockTargetTextures.js';
import { generateConcertTextures } from '../../src/textures/concertTextures.js';
import { generateTireFireTextures } from '../../src/textures/tireFireTextures.js';
import { generateHookahTextures } from '../../src/textures/hookahTextures.js';
import { generateRcCarTextures } from '../../src/textures/rcCarTextures.js';
import { generatePaperPlaneTextures } from '../../src/textures/paperPlaneTextures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', 'art-export');
const FULL_SKINS = process.argv.includes('--full-skins');
const SAMPLE_SKIN_COUNT = 24;
const scaleArg = process.argv.find((a) => a.startsWith('--scale='));
const EXPORT_SCALE = scaleArg ? Number(scaleArg.slice('--scale='.length)) : SCALE;

// Nearest-neighbor upscale so exported pixel art matches the blocky look the
// game actually renders on-screen (Phaser's `pixelArt: true` disables
// smoothing and scales every sprite up by SCALE).
function upscale(canvas, width, height, factor) {
  if (factor === 1) return canvas;
  const out = createCanvas(width * factor, height * factor);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, width * factor, height * factor);
  return out;
}

// { folder name, label, generator }. Order matches the gallery layout;
// the four asset types the user asked about (drone, people, animals, props)
// come first.
const CATEGORIES = [
  { dir: 'drone', label: 'Drone', run: (scene) => generateDroneTextures(scene) },
  {
    dir: 'people',
    label: 'People',
    run: (scene) =>
      generatePersonTextures(scene, FULL_SKINS ? {} : { skinIndexEnd: SAMPLE_SKIN_COUNT }),
  },
  { dir: 'workers', label: 'Workers', run: (scene) => generateWorkerTextures(scene) },
  { dir: 'animals', label: 'Animals', run: (scene) => generateAnimalTextures(scene) },
  { dir: 'buildings', label: 'Buildings', run: (scene) => generateBuildingTextures(scene) },
  { dir: 'props', label: 'Props & terrain', run: (scene) => generatePropTextures(scene) },
  { dir: 'vehicles', label: 'Vehicles', run: (scene) => generateVehicleTextures(scene) },
  { dir: 'weapons', label: 'Weapons & effects', run: (scene) => generateWeaponTextures(scene) },
  { dir: 'water', label: 'Water', run: (scene) => generateWaterTextures(scene) },
  { dir: 'effects', label: 'Effects', run: (scene) => generateEffectTextures(scene) },
  { dir: 'market', label: 'Market set piece', run: (scene) => generateMarketTextures(scene) },
  { dir: 'oilfield', label: 'Oilfield set piece', run: (scene) => generateOilfieldTextures(scene) },
  { dir: 'farm-field', label: 'Farm field set piece', run: (scene) => generateFarmFieldTextures(scene) },
  {
    dir: 'farm-compound',
    label: 'Farm compound set piece',
    run: (scene) => generateFarmCompoundTextures(scene),
  },
  { dir: 'soccer', label: 'Soccer set piece', run: (scene) => generateSoccerTextures(scene) },
  {
    dir: 'chicken-fight',
    label: 'Chicken fight set piece',
    run: (scene) => generateChickenFightTextures(scene),
  },
  { dir: 'camel-race', label: 'Camel race set piece', run: (scene) => generateCamelRaceTextures(scene) },
  { dir: 'rock-fight', label: 'Rock fight set piece', run: (scene) => generateRockFightTextures(scene) },
  {
    dir: 'rock-target',
    label: 'Rock target set piece',
    run: (scene) => generateRockTargetTextures(scene),
  },
  { dir: 'concert', label: 'Concert set piece', run: (scene) => generateConcertTextures(scene) },
  { dir: 'tire-fire', label: 'Tire fire set piece', run: (scene) => generateTireFireTextures(scene) },
  { dir: 'hookah', label: 'Hookah set piece', run: (scene) => generateHookahTextures(scene) },
  { dir: 'rc-car', label: 'RC car set piece', run: (scene) => generateRcCarTextures(scene) },
  {
    dir: 'paper-plane',
    label: 'Paper plane set piece',
    run: (scene) => generatePaperPlaneTextures(scene),
  },
];

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const { scene, canvases } = createMockScene();
  const galleryCategories = [];
  let totalCount = 0;

  for (const category of CATEGORIES) {
    const before = new Set(canvases.keys());
    category.run(scene);
    const newKeys = [...canvases.keys()].filter((k) => !before.has(k)).sort();
    if (newKeys.length === 0) continue;

    const dir = path.join(OUT_DIR, category.dir);
    await mkdir(dir, { recursive: true });

    const items = [];
    for (const key of newKeys) {
      const { canvas, width, height } = canvases.get(key);
      const out = upscale(canvas, width, height, EXPORT_SCALE);
      const filename = `${key}.png`;
      await writeFile(path.join(dir, filename), out.toBuffer('image/png'));
      items.push({ key, filename, width: width * EXPORT_SCALE, height: height * EXPORT_SCALE });
    }
    totalCount += items.length;
    galleryCategories.push({ ...category, items });
    console.log(`  ${category.label}: ${items.length} textures -> art-export/${category.dir}/`);
  }

  await writeFile(path.join(OUT_DIR, 'index.html'), renderGallery(galleryCategories));

  console.log(`\nExported ${totalCount} textures at ${EXPORT_SCALE}x to ${OUT_DIR}`);
  console.log(`Open ${path.join(OUT_DIR, 'index.html')} to browse them.`);
  if (!FULL_SKINS) {
    console.log(
      `(People category used a ${SAMPLE_SKIN_COUNT}-skin sample; re-run with --full-skins for all 200 variants.)`
    );
  }
}

function renderGallery(categories) {
  const nav = categories
    .map((c) => `<a href="#${c.dir}">${escapeHtml(c.label)} (${c.items.length})</a>`)
    .join('');

  const sections = categories
    .map((c) => {
      const cards = c.items
        .map((item) => {
          const scale = Math.max(1, Math.min(8, Math.round(160 / Math.max(item.width, item.height))));
          return `
        <figure class="card">
          <div class="thumb" style="width:${item.width * scale}px;height:${item.height * scale}px">
            <img src="${c.dir}/${item.filename}" width="${item.width * scale}" height="${item.height * scale}" alt="${escapeHtml(item.key)}">
          </div>
          <figcaption>${escapeHtml(item.key)}<span>${item.width}&times;${item.height}</span></figcaption>
        </figure>`;
        })
        .join('');
      return `
    <section id="${c.dir}">
      <h2>${escapeHtml(c.label)}</h2>
      <div class="grid">${cards}</div>
    </section>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>cozy-drone — procedural art export</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 0 2rem 4rem; background: #1b1b1f; color: #eee; }
  header { position: sticky; top: 0; background: #1b1b1f; padding: 1.5rem 0 1rem; z-index: 1; border-bottom: 1px solid #333; }
  h1 { margin: 0 0 0.75rem; font-size: 1.3rem; }
  nav { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  nav a { color: #9cf; text-decoration: none; font-size: 0.85rem; padding: 0.2rem 0.5rem; border: 1px solid #334; border-radius: 4px; }
  nav a:hover { background: #223; }
  h2 { font-size: 1.05rem; border-bottom: 1px solid #333; padding-bottom: 0.4rem; margin-top: 2.5rem; }
  .grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }
  .card { margin: 0; background: #26262c; border-radius: 6px; padding: 0.6rem; text-align: center; }
  .thumb { display: flex; align-items: center; justify-content: center; background:
    repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 50% / 16px 16px; border-radius: 4px; margin: 0 auto; }
  .thumb img { image-rendering: pixelated; display: block; }
  figcaption { font-size: 0.7rem; color: #ccc; margin-top: 0.4rem; max-width: 140px; word-break: break-all; }
  figcaption span { display: block; color: #777; }
</style>
</head>
<body>
<header>
  <h1>cozy-drone procedural art export</h1>
  <nav>${nav}</nav>
</header>
${sections}
</body>
</html>`;
}

main();
