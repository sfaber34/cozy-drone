import Phaser from "phaser";
import {
  TILE, SCALE, MOBILE_DIALOG_SCALE,
  BUS_ROUTE_BLOCK_COL, BUS_ROUTE_ROAD_TILES, BUS_ROAD_GAP_TILES,
  BUS_TERMINAL_OFFSET_TILES, BUS_LOOP_EXTENSION_TILES,
  BUS_COUNT, BUS_SPEED, BUS_CAPACITY, BUS_RIDER_COUNT,
  BUS_HP, BUS_HIT_RADIUS, BUS_LOAD_TIME,
  EXPLOSION_VOLUME, SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY,
} from "../constants.js";
import { ghostLines } from "../dialog.js";
import { skinTex } from "./peopleSystem.js";
import { playSfxAt, playDeathSfxAt } from "./audioSystem.js";
import { tryRegisterGhostBubble } from "./ghostBubbleUtils.js";

// ---------------------------------------------------------------------------
// Route geometry helpers
// ---------------------------------------------------------------------------

function getBusRouteGeometry(scene) {
  const rt = scene.townRoadTile; // = TILE * SCALE = 48px
  const gap = BUS_ROAD_GAP_TILES * rt;

  // Centerline X: the vertical town road at BUS_ROUTE_BLOCK_COL
  const centerX =
    scene.townStartX +
    BUS_ROUTE_BLOCK_COL * scene.townRoadSpacing * rt +
    rt / 2;

  // Each road is offset left/right from center
  const outboundX = centerX - gap; // A→B (southbound, left lane)
  const returnX   = centerX + gap; // B→A (northbound, right lane)

  // Terminal A sits BUS_TERMINAL_OFFSET_TILES below the town's south edge
  const termAY = scene.townEndY + BUS_TERMINAL_OFFSET_TILES * rt;
  // Terminal B is further south
  const termBY = termAY + BUS_ROUTE_ROAD_TILES * rt;

  // Connecting road Y positions — the loop corners beyond each terminal
  const connTopY    = termAY - BUS_LOOP_EXTENSION_TILES * rt;
  const connBottomY = termBY + BUS_LOOP_EXTENSION_TILES * rt;

  return { centerX, outboundX, returnX, termAY, termBY, connTopY, connBottomY, rt };
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

function drawRoads(scene, geo) {
  const { outboundX, returnX, connTopY, connBottomY, rt } = geo;
  const roadW    = rt;
  const connLeft = outboundX - roadW / 2;
  const connW    = returnX - outboundX + roadW;

  const g = scene.add.graphics().setDepth(1.2);
  g.fillStyle(0x909090, 1);

  // Two vertical road strips
  g.fillRect(outboundX - roadW / 2, connTopY, roadW, connBottomY - connTopY);
  g.fillRect(returnX   - roadW / 2, connTopY, roadW, connBottomY - connTopY);

  // Horizontal connecting roads at top and bottom corners
  g.fillRect(connLeft, connTopY    - roadW / 2, connW, roadW);
  g.fillRect(connLeft, connBottomY - roadW / 2, connW, roadW);

  // Centre dashes on vertical sections
  g.fillStyle(0xffffff, 0.35);
  const dashH = rt * 0.4;
  const dashW = rt * 0.4;
  for (let y = connTopY; y < connBottomY; y += rt) {
    g.fillRect(outboundX - 1, y, 2, dashH);
    g.fillRect(returnX   - 1, y, 2, dashH);
  }

  // Centre dashes on horizontal connecting roads
  for (let x = connLeft; x < connLeft + connW; x += rt) {
    g.fillRect(x, connTopY    - 1, dashW, 2);
    g.fillRect(x, connBottomY - 1, dashW, 2);
  }
}

function drawTerminal(scene, geo, terminalIdx) {
  const { outboundX, returnX, termAY, termBY, rt } = geo;
  // Terminal A is the outbound (left) stop; terminal B is the return (right) stop
  const y     = terminalIdx === 0 ? termAY : termBY;
  const laneX = terminalIdx === 0 ? outboundX : returnX;

  // Concrete platform centred on the active lane
  const platLeft = laneX - rt;
  const platW    = rt * 2;
  const g = scene.add.graphics().setDepth(1.3);
  g.fillStyle(0xc0b8a8, 1);
  g.fillRect(platLeft, y - 24, platW, 48);
  g.fillStyle(0xffcc00, 1);
  g.fillRect(platLeft, y - 24, platW, 3);
  g.fillRect(platLeft, y + 21, platW, 3);

  scene.add.image(laneX, y - 16, "bus-shelter").setScale(SCALE).setDepth(2);

  const label = terminalIdx === 0 ? "BUS TERMINAL" : "SOUTH TERMINAL";
  scene.add
    .text(laneX, y - 40, label, {
      fontFamily: "monospace", fontSize: "8px",
      color: "#ffffff", backgroundColor: "#0044aacc",
      padding: { x: 5, y: 2 },
    })
    .setOrigin(0.5)
    .setScale(SCALE * 0.45)
    .setDepth(5);
}

// ---------------------------------------------------------------------------
// Rider factory
// ---------------------------------------------------------------------------

// spawnX/spawnY are the visual position; termX/termY are the road-centre anchor used
// for boarding logic.  Keeping them separate lets us put riders off the road while
// the bus still loads anyone whose homeTerminalSide matches.
function spawnRider(scene, rng, terminalSide, termX, termY, spawnX, spawnY) {
  const skinId = rng.between(0, 199);
  // Small jitter so the group looks natural, not perfectly grid-aligned
  const px = spawnX + (Math.random() - 0.5) * 14;
  const py = spawnY + (Math.random() - 0.5) * 14;

  const sprite = scene.add
    .image(px, py, `person-stand-${skinId}`)
    .setScale(SCALE)
    .setDepth(3);

  const rider = {
    sprite,
    skinId,
    state: "idle",
    managedBySetPiece: true,
    returnHome: { x: px, y: py },
    greeting: null,
    bubble: null,
    waveTimer: 0, waveFrame: 0,
    runAngle: 0, runTimer: 0, runFrame: 0,
    wanderTimer: 0, wanderDuration: 999, wanderAngle: null,
    hideTarget: null,
    homeX: px, homeY: py,
    scatterPanic: true,
    // Bus-specific
    busState: "waiting",       // "waiting" | "riding" | "scattered"
    homeTerminalSide: terminalSide,
    homeTerminalX: termX,
    homeTerminalY: termY,
  };

  scene.people.push(rider);
  return rider;
}

// ---------------------------------------------------------------------------
// createBusRoute
// ---------------------------------------------------------------------------

export function createBusRoute(scene, rng) {
  const geo = getBusRouteGeometry(scene);
  const { outboundX, returnX, termAY, termBY, connTopY, connBottomY } = geo;

  scene.busGeo = geo;
  scene.buses  = [];

  drawRoads(scene, geo);
  drawTerminal(scene, geo, 0);
  drawTerminal(scene, geo, 1);

  // Clockwise loop waypoints: TL → stop-A → BL → BR → stop-B → TR → (back to TL)
  scene.busWaypoints = [
    { x: outboundX, y: connTopY,    terminalIdx: -1 }, // 0: TL corner
    { x: outboundX, y: termAY,      terminalIdx:  0 }, // 1: Terminal A stop (outbound)
    { x: outboundX, y: connBottomY, terminalIdx: -1 }, // 2: BL corner
    { x: returnX,   y: connBottomY, terminalIdx: -1 }, // 3: BR corner
    { x: returnX,   y: termBY,      terminalIdx:  1 }, // 4: Terminal B stop (return)
    { x: returnX,   y: connTopY,    terminalIdx: -1 }, // 5: TR corner
  ];

  // Riders spawn in groups on either side of the road, clear of the bus lane.
  // Road is rt wide centred on laneX; put riders at least rt/2 + a margin away.
  const { rt } = geo;
  const sideBase  = rt * 0.7;          // min distance from road centre
  const sideRange = rt * 0.8;          // additional random spread
  const yRange    = rt * 2.5;          // vertical spread along terminal
  scene.busRiders = [];
  for (let i = 0; i < BUS_RIDER_COUNT; i++) {
    const sign = i % 2 === 0 ? -1 : 1; // alternate left / right
    const sx   = sign * (sideBase + Math.random() * sideRange);
    const sy   = (Math.random() - 0.5) * yRange;
    scene.busRiders.push(spawnRider(scene, rng, "A", outboundX, termAY, outboundX + sx, termAY + sy));
    scene.busRiders.push(spawnRider(scene, rng, "B", returnX,   termBY, returnX   + sx, termBY + sy));
  }

  // Two buses start at opposite terminals, staggered by half a load cycle
  const startConfigs = [
    { x: outboundX, y: termAY, waypointIdx: 1, atTerminalIdx: 0, loadTimer: 0 },
    { x: returnX,   y: termBY, waypointIdx: 4, atTerminalIdx: 1, loadTimer: BUS_LOAD_TIME / 2 },
  ];

  for (let bi = 0; bi < BUS_COUNT; bi++) {
    const cfg = startConfigs[bi];
    const sprite = scene.add
      .image(cfg.x, cfg.y, "bus")
      .setScale(SCALE)
      .setDepth(4);
    // Initial rotation: bus 0 faces south (π), bus 1 faces north (0)
    sprite.setRotation(bi === 0 ? Math.PI : 0);

    scene.buses.push({
      sprite,
      hp: BUS_HP,
      maxHp: BUS_HP,
      state: "loading",
      waypointIdx: cfg.waypointIdx,
      atTerminalIdx: cfg.atTerminalIdx,
      riders: [],
      scatteredRiders: [],
      loadTimer: cfg.loadTimer,
    });
  }
}

// ---------------------------------------------------------------------------
// updateBusSystem
// ---------------------------------------------------------------------------

export function updateBusSystem(scene, dt, delta) {
  if (!scene.buses) return;

  const wps = scene.busWaypoints;

  for (const bus of scene.buses) {
    if (bus.state === "destroyed") continue;

    // Remove riding passengers who died
    for (let ri = bus.riders.length - 1; ri >= 0; ri--) {
      const r = bus.riders[ri];
      if (r.state === "ghost" || r.state === "gone") bus.riders.splice(ri, 1);
    }

    // ----------------------------------------------------------------
    if (bus.state === "loading") {
      bus.loadTimer += dt;

      if (bus.riders.length < BUS_CAPACITY) {
        const termSide = bus.atTerminalIdx === 0 ? "A" : "B";
        for (const r of scene.busRiders) {
          if (bus.riders.length >= BUS_CAPACITY) break;
          if (r.busState !== "waiting" || r.state !== "idle") continue;
          if (r.homeTerminalSide !== termSide) continue;
          if (r.lastBus === bus) continue; // wait for the NEXT bus
          r.busState = "riding";
          r.sprite.setVisible(false);
          bus.riders.push(r);
        }
      }

      if (bus.loadTimer >= BUS_LOAD_TIME) {
        bus.loadTimer = 0;
        bus.state = "driving";
      }
    }

    // ----------------------------------------------------------------
    else if (bus.state === "driving") {
      const wp   = wps[bus.waypointIdx];
      const dx   = wp.x - bus.sprite.x;
      const dy   = wp.y - bus.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = BUS_SPEED * dt;

      if (dist <= step + 2) {
        bus.sprite.setPosition(wp.x, wp.y);
        bus.waypointIdx = (bus.waypointIdx + 1) % wps.length;

        if (wp.terminalIdx >= 0) {
          // Arrived at a terminal stop — unload then reload
          bus.atTerminalIdx = wp.terminalIdx;
          bus.state = "unloading";
        }
      } else {
        const angle = Math.atan2(dy, dx);
        bus.sprite.x += Math.cos(angle) * step;
        bus.sprite.y += Math.sin(angle) * step;
        bus.sprite.setRotation(angle + Math.PI / 2);
      }
    }

    // ----------------------------------------------------------------
    else if (bus.state === "unloading") {
      // Step riders off the road to either side, then start loading again
      const stopX  = bus.sprite.x;
      const stopY  = bus.sprite.y;
      const rt     = scene.busGeo.rt;
      const sideBase  = rt * 0.7;
      const sideRange = rt * 0.8;
      const yRange    = rt * 2.5;
      for (let ri = 0; ri < bus.riders.length; ri++) {
        const r = bus.riders[ri];
        if (r.state === "ghost" || r.state === "gone") continue;
        const sign = ri % 2 === 0 ? -1 : 1;
        const ox = sign * (sideBase + Math.random() * sideRange) + (Math.random() - 0.5) * 14;
        const oy = (Math.random() - 0.5) * yRange;
        r.sprite.setVisible(true);
        r.sprite.setPosition(stopX + ox, stopY + oy);
        r.sprite.setTexture(`person-stand-${r.skinId}`);
        r.homeTerminalSide = bus.atTerminalIdx === 0 ? "A" : "B";
        r.homeTerminalX    = stopX;
        r.homeTerminalY    = stopY;
        r.returnHome       = { x: stopX + ox, y: stopY + oy };
        r.lastBus          = bus; // won't reboard this bus; waits for the next one
        r.busState         = "waiting";
        r.state            = "idle";
      }
      bus.riders    = [];
      bus.state     = "loading";
      bus.loadTimer = 0;
    }

    // ----------------------------------------------------------------
    else if (bus.state === "disabled") {
      for (let ri = bus.scatteredRiders.length - 1; ri >= 0; ri--) {
        const r = bus.scatteredRiders[ri];
        if (r.state === "ghost" || r.state === "gone") {
          bus.scatteredRiders.splice(ri, 1);
          continue;
        }
        if (r.state === "idle") {
          r.sprite.setVisible(false);
          r.busState = "riding";
          bus.riders.push(r);
          bus.scatteredRiders.splice(ri, 1);
        }
      }

      if (bus.scatteredRiders.length === 0) bus.state = "driving";
    }
  }
}

// ---------------------------------------------------------------------------
// damageBusAt — called by missile / cannon impact functions
//   damage: 1.0 per missile, 0.5 per cannon hit (consistent with buildings)
// ---------------------------------------------------------------------------

export function damageBusAt(scene, x, y, damage) {
  if (!scene.buses) return;
  for (const bus of scene.buses) {
    if (bus.state === "destroyed") continue;
    const d = Phaser.Math.Distance.Between(x, y, bus.sprite.x, bus.sprite.y);
    if (d >= BUS_HIT_RADIUS) continue;

    bus.hp -= damage;
    if (bus.hp <= 0) {
      _destroyBus(scene, bus, x, y);
    } else if (bus.state !== "disabled") {
      _disableBus(scene, bus, x, y);
    }
    break; // one bus per impact
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _disableBus(scene, bus, hitX, hitY) {
  bus.state = "disabled";
  bus.scatteredRiders = [...bus.riders];
  bus.riders = [];

  for (const r of bus.scatteredRiders) {
    if (r.state === "ghost" || r.state === "gone") continue;
    const ox = (Math.random() - 0.5) * 60;
    const oy = (Math.random() - 0.5) * 60;
    r.sprite.setVisible(true);
    r.sprite.setPosition(bus.sprite.x + ox, bus.sprite.y + oy);
    r.sprite.setTexture(`person-stand-${r.skinId}`);
    r.busState    = "scattered";
    r.returnHome  = { x: bus.sprite.x, y: bus.sprite.y };
    r.state       = "panicking";
    r.hideTarget  = null;
    r.scatterPanic = true;
    r.panicTimer  = 0;
    r.runAngle    = Phaser.Math.Angle.Between(hitX, hitY, r.sprite.x, r.sprite.y) +
                    (Math.random() - 0.5) * Math.PI;
  }
}

function _destroyBus(scene, bus, hitX, hitY) {
  bus.state = "destroyed";
  bus.hp    = 0;
  bus.sprite.setTexture("bus-dead").clearTint();

  // Kill all passengers (riding + previously scattered but still alive)
  const victims = [...bus.riders, ...bus.scatteredRiders];
  for (const r of victims) {
    if (r.state === "ghost" || r.state === "gone") continue;
    r.sprite.setVisible(true);
    r.sprite.setPosition(
      bus.sprite.x + (Math.random() - 0.5) * 50,
      bus.sprite.y + (Math.random() - 0.5) * 50,
    );
    r.state  = "ghost";
    r.busState = "scattered"; // keep out of boarding logic
    scene.kills++;
    playDeathSfxAt(scene, r.sprite.x, r.sprite.y);
    r.sprite.setTexture("ghost").setAlpha(0.8).setDepth(13);
    if (r.bubble) { r.bubble.destroy(); r.bubble = null; }
    const awayAngle = Phaser.Math.Angle.Between(hitX, hitY, r.sprite.x, r.sprite.y);
    r.ghostDriftX        = Math.cos(awayAngle) * (15 + Math.random() * 25);
    r.ghostDriftY        = -(20 + Math.random() * 20);
    r.ghostWobbleOffset  = Math.random() * Math.PI * 2;
    if (tryRegisterGhostBubble(scene, r.sprite.x, r.sprite.y)) {
      const line = Phaser.Utils.Array.GetRandom(ghostLines);
      r.bubble = scene.add
        .text(r.sprite.x + 20, r.sprite.y - 20, line, {
          fontFamily: "monospace", fontSize: "8px",
          color: "#aaccff", backgroundColor: "#000000aa",
          padding: { x: 4, y: 3 },
        })
        .setScale(SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1)).setDepth(14);
      scene.hudCam.ignore(r.bubble);
    }
  }
  bus.riders = [];
  bus.scatteredRiders = [];

  // Explosion
  const exp = scene.add
    .sprite(bus.sprite.x, bus.sprite.y, "explosion-sheet", 0)
    .setScale(SCALE * 2).setDepth(11);
  scene.hudCam.ignore(exp);
  exp.play("explode");
  exp.once("animationcomplete", () => exp.destroy());
  playSfxAt(scene, "explosion", bus.sprite.x, bus.sprite.y, EXPLOSION_VOLUME);
  scene.cameras.main.shake(SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY);
}
