// Mini-map HUD overlay (top-right).
//
// Semi-transparent panel showing:
//   - Background + border
//   - Heat-map blobs for people density (NOT per-person dots — with ~400
//     people each dot would be a 1-px speck indistinguishable from noise,
//     so we grid-aggregate and color each cell by local density instead).
//   - Airfield marker (static plus-sign)
//   - Drone marker (filled triangle that rotates with the drone's heading)
//
// Rendered exclusively on the HUD camera (main camera ignores the graphics
// objects) so it overlays the viewport regardless of world scroll/zoom.
import {
  WORLD_W, WORLD_H, TILE, SCALE,
  MINIMAP_SIZE_PX, MINIMAP_MARGIN_PX,
  MINIMAP_BG_COLOR, MINIMAP_BG_ALPHA,
  MINIMAP_BORDER_COLOR, MINIMAP_BORDER_ALPHA, MINIMAP_BORDER_THICKNESS_PX,
  MINIMAP_GRID_CELLS,
  MINIMAP_HEAT_COLOR, MINIMAP_HEAT_MIN_ALPHA, MINIMAP_HEAT_MAX_ALPHA,
  MINIMAP_UPDATE_INTERVAL_MS,
  MINIMAP_AIRFIELD_COLOR, MINIMAP_AIRFIELD_SIZE_PX,
  MINIMAP_DRONE_COLOR, MINIMAP_DRONE_SIZE_PX,
  MOBILE_ZOOM_FACTOR,
} from "../constants.js";

const MINIMAP_DEPTH = 100; // above HUD text? They use 100 too — tie-broken by creation order, which is fine.
const WORLD_W_PX = WORLD_W * TILE * SCALE;
const WORLD_H_PX = WORLD_H * TILE * SCALE;

/**
 * Build the minimap. Attaches state to `scene._minimap` and registers the
 * three Graphics objects with the HUD/main camera visibility lists so the
 * overlay only shows on top of the HUD and never inside the world.
 *
 * Call AFTER scene.hudCam is created and AFTER the bulk HUD-ignore pass in
 * tryDeferredWorldInit — otherwise our graphics would be swept into the
 * HUD-camera ignore list and disappear.
 */
export function createMinimap(scene) {
  if (scene._minimap) return;

  // Mobile renders to an internal canvas scaled up by 1/MOBILE_ZOOM_FACTOR,
  // then CSS-shrinks to the viewport. To appear at its intended CSS size
  // on every device, boost every pixel value by 1/MOBILE_ZOOM_FACTOR on
  // mobile so the CSS downscale lands it at the target physical size.
  const boost = scene.isMobile && MOBILE_ZOOM_FACTOR > 0 ? 1 / MOBILE_ZOOM_FACTOR : 1;
  const size = MINIMAP_SIZE_PX * boost;
  const margin = MINIMAP_MARGIN_PX * boost;

  const bg = scene.add.graphics().setDepth(MINIMAP_DEPTH);
  const heat = scene.add.graphics().setDepth(MINIMAP_DEPTH + 1);
  const markers = scene.add.graphics().setDepth(MINIMAP_DEPTH + 2);

  // HUD-only visibility: main camera skips these, HUD camera renders them.
  // (HUD cam will render them by default since they're not in its ignore list.)
  scene.cameras.main.ignore([bg, heat, markers]);

  scene._minimap = {
    bg, heat, markers,
    boost,
    size,
    margin,
    // cornerX/Y are recomputed on resize; stored for draw* helpers.
    cornerX: 0,
    cornerY: 0,
    accumMs: MINIMAP_UPDATE_INTERVAL_MS, // force immediate first heatmap draw
  };

  layoutMinimap(scene);
  drawBackground(scene);
  drawHeatmap(scene);
  drawMarkers(scene);

  // Re-layout on window/canvas resize (orientation change, viewport toggle).
  scene.scale.on("resize", () => {
    if (!scene._minimap) return;
    layoutMinimap(scene);
    drawBackground(scene);
    drawHeatmap(scene);
    drawMarkers(scene);
  });
}

/**
 * Per-frame update. Drone marker redraws every frame (smooth rotation);
 * heatmap recomputes at most every MINIMAP_UPDATE_INTERVAL_MS so counting
 * 400 people doesn't bog down every tick.
 */
export function updateMinimap(scene, deltaMs) {
  const m = scene._minimap;
  if (!m) return;

  m.accumMs += deltaMs;
  if (m.accumMs >= MINIMAP_UPDATE_INTERVAL_MS) {
    m.accumMs = 0;
    drawHeatmap(scene);
  }
  // Markers always redraw — cheap (two shapes) and the drone moves every frame.
  drawMarkers(scene);
}

export function destroyMinimap(scene) {
  const m = scene._minimap;
  if (!m) return;
  m.bg.destroy();
  m.heat.destroy();
  m.markers.destroy();
  scene._minimap = null;
}

// ----------------------------------------------------------------------

function layoutMinimap(scene) {
  const m = scene._minimap;
  m.cornerX = scene.scale.width - m.size - m.margin;
  m.cornerY = m.margin;
}

function drawBackground(scene) {
  const m = scene._minimap;
  const { bg, cornerX, cornerY, size, boost } = m;
  bg.clear();
  bg.fillStyle(MINIMAP_BG_COLOR, MINIMAP_BG_ALPHA);
  bg.fillRect(cornerX, cornerY, size, size);
  bg.lineStyle(
    MINIMAP_BORDER_THICKNESS_PX * boost,
    MINIMAP_BORDER_COLOR,
    MINIMAP_BORDER_ALPHA,
  );
  bg.strokeRect(cornerX, cornerY, size, size);
}

function drawHeatmap(scene) {
  const m = scene._minimap;
  const { heat, cornerX, cornerY, size } = m;
  const cells = MINIMAP_GRID_CELLS;
  const cellSize = size / cells;

  // Count live people per grid cell. The Freedoms kill-counter caps on
  // countTotalPeople() which sums THREE pools — scene.people (wanderers +
  // all set-piece inhabitants), scene.dirtBikers (one person each), and
  // each scene.townCars entry's `passengers` (multiple people per car).
  // The heatmap has to mirror that or it misrepresents target density.
  const grid = new Int32Array(cells * cells);
  const bucket = (x, y, weight) => {
    if (x < 0 || x >= WORLD_W_PX || y < 0 || y >= WORLD_H_PX) return;
    const gx = Math.min(cells - 1, Math.floor((x / WORLD_W_PX) * cells));
    const gy = Math.min(cells - 1, Math.floor((y / WORLD_H_PX) * cells));
    grid[gy * cells + gx] += weight;
  };

  const people = scene.people || [];
  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    if (!p || !p.sprite) continue;
    const state = p.state;
    if (state === "ghost" || state === "gone" || state === "dead") continue;
    bucket(p.sprite.x, p.sprite.y, 1);
  }

  // Dirt bikers — each contributes one rider.
  const bikers = scene.dirtBikers || [];
  for (let i = 0; i < bikers.length; i++) {
    const b = bikers[i];
    if (!b || !b.alive || !b.sprite) continue;
    bucket(b.sprite.x, b.sprite.y, 1);
  }

  // Town cars — each alive car is a mobile cluster of `passengers` people.
  const cars = scene.townCars || [];
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    if (!c || !c.alive || !c.sprite) continue;
    bucket(c.sprite.x, c.sprite.y, c.passengers || 0);
  }

  // Normalize against the peak cell so the hottest blob always hits MAX_ALPHA,
  // regardless of how many people exist. Keeps the heatmap readable as kills
  // thin out the population.
  let peak = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i] > peak) peak = grid[i];

  heat.clear();
  if (peak === 0) return;

  const alphaRange = MINIMAP_HEAT_MAX_ALPHA - MINIMAP_HEAT_MIN_ALPHA;
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const c = grid[gy * cells + gx];
      if (c <= 0) continue;
      // Sqrt keeps small groups still visible while peaks remain distinct.
      const density = Math.sqrt(c / peak);
      const alpha = MINIMAP_HEAT_MIN_ALPHA + density * alphaRange;
      heat.fillStyle(MINIMAP_HEAT_COLOR, alpha);
      heat.fillRect(
        cornerX + gx * cellSize,
        cornerY + gy * cellSize,
        cellSize + 0.5, // tiny overlap so adjacent cells blend without gaps
        cellSize + 0.5,
      );
    }
  }
}

function drawMarkers(scene) {
  const m = scene._minimap;
  const { markers, cornerX, cornerY, size, boost } = m;
  markers.clear();

  // --- Airfield marker (plus sign) ---
  // Anchor to scene.runway (the actual runway centerline) rather than
  // airfield.bounds.cx/cy — the bounds center gets pulled off-runway by
  // the hangar appendage, which made the marker visibly drift up-right
  // of where the runway actually is on screen.
  if (scene.runway) {
    const ax = cornerX + (scene.runway.x / WORLD_W_PX) * size;
    const ay = cornerY + (scene.runway.y / WORLD_H_PX) * size;
    const r = (MINIMAP_AIRFIELD_SIZE_PX * boost) / 2;
    markers.lineStyle(1.5 * boost, MINIMAP_AIRFIELD_COLOR, 1);
    markers.beginPath();
    markers.moveTo(ax - r, ay);
    markers.lineTo(ax + r, ay);
    markers.strokePath();
    markers.beginPath();
    markers.moveTo(ax, ay - r);
    markers.lineTo(ax, ay + r);
    markers.strokePath();
  }

  // --- Drone marker (triangle pointing in heading) ---
  if (scene.drone) {
    const dx = cornerX + (scene.drone.x / WORLD_W_PX) * size;
    const dy = cornerY + (scene.drone.y / WORLD_H_PX) * size;
    const r = MINIMAP_DRONE_SIZE_PX * boost;
    // Drone sprite: angle 0 = facing NORTH (−Y). Convert to screen radians
    // where 0 rad = +X: subtract 90°.
    const a = (((scene.drone.angle || 0) - 90) * Math.PI) / 180;
    const tipX = dx + Math.cos(a) * r;
    const tipY = dy + Math.sin(a) * r;
    const backL = a + (2 * Math.PI) / 3;
    const backR = a - (2 * Math.PI) / 3;
    const lx = dx + Math.cos(backL) * r * 0.6;
    const ly = dy + Math.sin(backL) * r * 0.6;
    const rx = dx + Math.cos(backR) * r * 0.6;
    const ry = dy + Math.sin(backR) * r * 0.6;
    markers.fillStyle(MINIMAP_DRONE_COLOR, 1);
    markers.beginPath();
    markers.moveTo(tipX, tipY);
    markers.lineTo(lx, ly);
    markers.lineTo(rx, ry);
    markers.closePath();
    markers.fillPath();
  }
}
