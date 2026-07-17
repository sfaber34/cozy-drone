---
name: verify
description: How to build, launch, and drive Cozy Drone (Phaser 3 + Vite browser game) to verify changes end-to-end.
---

# Verifying Cozy Drone

## Build / launch

- `npx vite build` — compile check (~2.5s). Chunk-size warning is normal.
- `npm run dev` — dev server; port 5173 is often taken, Vite falls back to 5174. Check the log for the actual port.
- Drive it in Chrome via the claude-in-chrome tools (no Playwright in this env).

## Driving the game

- Everything is one canvas — no DOM elements to click. Take a screenshot first,
  then click at pixel coordinates. Screenshot dimensions can shift between
  calls; re-screenshot before coordinate-sensitive clicks.
- Briefing modal: button(s) centered horizontally near the bottom. The click is
  also the audio-unlock gesture (raw `mousedown` listener on the canvas).
- Intro cutscene runs ~10s after START before controls respond.
- Holding keys: the `computer` tool's `key` action can't hold. Dispatch synthetic
  events via javascript_tool — Phaser reads `keyCode`, which must be defined via
  `Object.defineProperty` (the KeyboardEvent constructor ignores it):
  ```js
  const ev = new KeyboardEvent('keydown', {key:'w', code:'KeyW', bubbles:true});
  Object.defineProperty(ev, 'keyCode', {get: () => 87});
  window.dispatchEvent(ev);  // held until you dispatch matching keyup
  ```
  W=87 accel, E=69 climb, Space=32 fire. Click canvas to set missile target.
- Game state evidence: HUD (top-left) shows ALT/SPD/FREEDOMS. The save file is
  readable via `localStorage.getItem('cozy-drone-save')` (JSON: seed, drone,
  kills, entity arrays).
- Console errors: `read_console_messages` with `onlyErrors: true` — Phaser
  errors (e.g. texture-key collisions) surface there, not visually.

## Gotchas

- `scene.restart()` crashes the game: person-skin textures live in the global
  TextureManager and re-generation hits "Texture key already in use" then a
  fatal null deref. Full-restart flows must use `window.location.reload()`
  (victory screen and briefing RESTART both do).
- World init is deferred until 200 person skins generate async (~seconds after
  create); people/vehicles don't exist until then.
