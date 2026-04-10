import Phaser from "phaser";
import {
  introLines,
  greetings,
  ghostLines,
  buildingGhostLines,
  cheerPhrases,
  merchantGreetings,
  shopperGreetings,
  shepherdGreetings,
  workerGreetings,
} from "../dialog.js";

const WORLD_W = 3200;
const WORLD_H = 3200;
const TILE = 16;
const SCALE = 3;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  create() {
    // --- Biome ground layer ---
    // Map zones (in tile coords):
    //   Town:  NW quadrant (0 - WORLD_W/2, 0 - WORLD_H/2)
    //   Farm:  NE quadrant (WORLD_W/2 - WORLD_W, 0 - WORLD_H/2)
    //   Desert: bottom half (0 - WORLD_W, WORLD_H/2 - WORLD_H) — runway area
    this.groundLayer = this.add.group();
    const rng = new Phaser.Math.RandomDataGenerator(["desert"]);
    const halfW = WORLD_W / 2;
    const halfH = WORLD_H / 2;

    for (let y = 0; y < WORLD_H; y += TILE) {
      for (let x = 0; x < WORLD_W; x += TILE) {
        let tex, frame;
        if (y < halfH && x < halfW) {
          // Town — grass base
          tex = "grass";
          frame = undefined;
        } else if (y < halfH && x >= halfW) {
          // Farm — grass with crop patches
          if ((Math.floor(x / TILE) + Math.floor(y / TILE)) % 7 < 4) {
            tex = "crop-tiles";
            frame = rng.between(0, 3);
          } else {
            tex = "grass";
            frame = undefined;
          }
        } else {
          // Desert
          tex = "desert-tiles";
          frame = rng.between(0, 3);
        }
        const tile =
          frame !== undefined
            ? this.add.image(x, y, tex, frame).setOrigin(0, 0).setScale(SCALE)
            : this.add.image(x, y, tex).setOrigin(0, 0).setScale(SCALE);
        this.groundLayer.add(tile);
      }
    }

    // --- Desert props (spread evenly across bottom half) ---
    const desertTop = halfH * SCALE;
    const desertBot = WORLD_H * SCALE;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * WORLD_W * SCALE;
      const y = desertTop + Math.random() * (desertBot - desertTop);
      const tex = Math.random() > 0.5 ? "rock" : "brush";
      this.add.image(x, y, tex).setScale(SCALE).setDepth(1);
    }

    // Initialize people array early (wedding + regular people both push to it)
    this.people = [];

    // ==========================================
    // WEDDING SCENE (out in the desert)
    // ==========================================
    const weddingX = WORLD_W * SCALE * 0.75;
    const weddingY = WORLD_H * SCALE * 0.6;
    this.weddingPos = { x: weddingX, y: weddingY };

    // Wedding rug (aisle)
    for (let r = -2; r <= 2; r++) {
      this.add
        .image(weddingX, weddingY + r * 12 * SCALE, "wedding-rug")
        .setScale(SCALE)
        .setDepth(1.5);
    }

    // Wedding arch at the front
    this.add
      .image(weddingX, weddingY - 3 * 12 * SCALE, "wedding-arch")
      .setScale(SCALE)
      .setDepth(2);

    // Lanterns flanking the aisle
    for (let li = -2; li <= 2; li++) {
      this.add
        .image(weddingX - 50, weddingY + li * 40, "lantern")
        .setScale(SCALE)
        .setDepth(2);
      this.add
        .image(weddingX + 50, weddingY + li * 40, "lantern")
        .setScale(SCALE)
        .setDepth(2);
    }

    // Cushion seating (rows on each side)
    for (let row = 0; row < 4; row++) {
      for (let seat = 0; seat < 5; seat++) {
        this.add
          .image(weddingX - 80 - seat * 22, weddingY - 30 + row * 30, "cushion")
          .setScale(SCALE)
          .setDepth(1.5);
        this.add
          .image(weddingX + 80 + seat * 22, weddingY - 30 + row * 30, "cushion")
          .setScale(SCALE)
          .setDepth(1.5);
      }
    }

    // Priest at the arch
    const priestSprite = this.add
      .image(weddingX, weddingY - 3 * 12 * SCALE + 20, "priest")
      .setScale(SCALE)
      .setDepth(3);

    // Bride & Groom in front of the arch
    const brideSprite = this.add
      .image(weddingX - 25, weddingY - 2 * 12 * SCALE, "bride")
      .setScale(SCALE)
      .setDepth(3);
    const groomSprite = this.add
      .image(weddingX + 25, weddingY - 2 * 12 * SCALE, "groom")
      .setScale(SCALE)
      .setDepth(3);

    // Hearts floating from the couple
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        if (!brideSprite.active || !groomSprite.active) return;
        if (this.brideEntry.state !== "idle" || this.groomEntry.state !== "idle") return;
        const hx = (brideSprite.x + groomSprite.x) / 2;
        const hy = brideSprite.y - 10;
        const heart = this.add
          .image(hx, hy, "heart")
          .setScale(SCALE * 0.8)
          .setDepth(4);
        this.hudCam.ignore(heart);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const dist = 40 + Math.random() * 40;
        this.tweens.add({
          targets: heart,
          x: hx + Math.cos(angle) * dist,
          y: hy + Math.sin(angle) * dist - 20,
          alpha: 0,
          scale: SCALE * (0.4 + Math.random() * 0.4),
          duration: 1200 + Math.random() * 600,
          ease: "Quad.easeOut",
          onComplete: () => heart.destroy(),
        });
      },
    });

    // Wedding guests (seated on cushions, using different skins)
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < 4; row++) {
        for (let seat = 0; seat < 4; seat++) {
          const gx = weddingX + side * (80 + seat * 22);
          const gy = weddingY - 30 + row * 30;
          const skinId = rng.between(0, 9);
          const sprite = this.add
            .image(gx, gy, `person-stand-${skinId}`)
            .setScale(SCALE)
            .setDepth(2);
          this.people.push({
            sprite,
            skinId,
            state: "idle",
            greeting: "",
            noGreet: true,
            scatterPanic: true,
            scatterPanic: true,
            bubble: null,
            waveTimer: 0,
            waveFrame: 0,
            runAngle: 0,
            runTimer: 0,
            runFrame: 0,
            wanderTimer: 0,
            wanderDuration: 999,
            wanderAngle: null,
            hideTarget: null,
            homeX: gx,
            homeY: gy,
          });
        }
      }
    }

    // Also add bride, groom, priest to people array so they can react
    const weddingPeople = [
      { sprite: brideSprite },
      { sprite: groomSprite },
      { sprite: priestSprite },
    ];
    const weddingEntries = [];
    for (const wp of weddingPeople) {
      const entry = {
        sprite: wp.sprite,
        skinId: 0,
        state: "idle",
        greeting: "",
        noGreet: true,
        scatterPanic: true,
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 999,
        wanderAngle: null,
        hideTarget: null,
        homeX: wp.sprite.x,
        homeY: wp.sprite.y,
      };
      this.people.push(entry);
      weddingEntries.push(entry);
    }
    this.brideEntry = weddingEntries[0];
    this.groomEntry = weddingEntries[1];

    // ==========================================
    // SOCCER GAME (to the right of the wedding)
    // ==========================================
    const soccerX = weddingX + 500;
    const soccerY = weddingY;
    const fieldW = 300;
    const fieldH = 200;

    // Green pitch
    for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
      for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
        this.add
          .image(soccerX + fx, soccerY + fy, "grass")
          .setOrigin(0, 0)
          .setScale(SCALE)
          .setDepth(1);
      }
    }

    // Field boundary lines
    // Top & bottom
    for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
      this.add
        .image(soccerX + fx, soccerY - fieldH / 2, "field-line-h")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1.5);
      this.add
        .image(soccerX + fx, soccerY + fieldH / 2, "field-line-h")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1.5);
    }
    // Left & right
    for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
      this.add
        .image(soccerX - fieldW / 2, soccerY + fy, "field-line-v")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1.5);
      this.add
        .image(soccerX + fieldW / 2, soccerY + fy, "field-line-v")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1.5);
    }
    // Center line
    for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
      this.add
        .image(soccerX, soccerY + fy, "field-line-v")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1.5);
    }

    // Goals
    this.add
      .image(soccerX - fieldW / 2 - 10, soccerY, "soccer-goal")
      .setScale(SCALE)
      .setDepth(2)
      .setAngle(90);
    this.add
      .image(soccerX + fieldW / 2 + 10, soccerY, "soccer-goal")
      .setScale(SCALE)
      .setDepth(2)
      .setAngle(90);

    // Soccer ball
    const soccerBall = this.add
      .image(soccerX, soccerY, "soccer-ball")
      .setScale(SCALE)
      .setDepth(4);
    this.soccerBall = soccerBall;
    this.soccerActive = true;

    // Soccer players (5 per team)
    this.soccerPlayers = [];
    const teams = ["team-a", "team-b"];
    for (let t = 0; t < 2; t++) {
      const side = t === 0 ? -1 : 1;
      for (let p = 0; p < 5; p++) {
        const px = soccerX + side * (50 + rng.between(0, 80));
        const py = soccerY + rng.between(-80, 80);
        const sprite = this.add
          .image(px, py, `${teams[t]}-stand`)
          .setScale(SCALE)
          .setDepth(3);
        const player = {
          sprite,
          team: teams[t],
          targetX: px,
          targetY: py,
          runFrame: 0,
          runTimer: 0,
          chasing: false,
        };
        this.soccerPlayers.push(player);
        // Also add to people array so they react to explosions
        const personEntry = {
          sprite,
          skinId: 0,
          state: "idle",
          greeting: "",
          noGreet: true,
          scatterPanic: true,
          bubble: null,
          waveTimer: 0,
          waveFrame: 0,
          runAngle: 0,
          runTimer: 0,
          runFrame: 0,
          wanderTimer: 0,
          wanderDuration: 999,
          wanderAngle: null,
          hideTarget: null,
          homeX: px,
          homeY: py,
          isSoccerPlayer: true,
          teamSkin: teams[t],
        };
        this.people.push(personEntry);
        player.personEntry = personEntry;
      }
    }

    // Soccer ball movement — pick a random player to "have" the ball, then pass
    this.soccerBallHolder = null;
    this.soccerPassTimer = 0;
    this.soccerFieldCenter = { x: soccerX, y: soccerY };
    this.soccerFieldW = fieldW;
    this.soccerFieldH = fieldH;

    // Spectators around the field (cheering/clapping)
    this.soccerSpectators = [];
    // cheerPhrases imported from dialog.js
    // Rows of spectators on both long sides
    for (let side = -1; side <= 1; side += 2) {
      for (let s = 0; s < 12; s++) {
        const sx = soccerX - fieldW / 2 + 20 + s * (fieldW / 12);
        const sy = soccerY + side * (fieldH / 2 + 35 + rng.between(0, 20));
        const skinId = rng.between(0, 9);
        const sprite = this.add
          .image(sx, sy, `person-wave1-${skinId}`)
          .setScale(SCALE)
          .setDepth(2);
        const personEntry = {
          sprite,
          skinId,
          state: "idle",
          greeting: rng.pick(cheerPhrases),
          noGreet: true,
          scatterPanic: true,
          isSoccerSpectator: true,
          bubble: null,
          waveTimer: 0,
          waveFrame: 0,
          runAngle: 0,
          runTimer: 0,
          runFrame: 0,
          wanderTimer: 0,
          wanderDuration: 999,
          wanderAngle: null,
          hideTarget: null,
          homeX: sx,
          homeY: sy,
        };
        this.people.push(personEntry);
        this.soccerSpectators.push({
          sprite,
          skinId,
          personEntry,
          clapTimer: rng.between(0, 500),
          clapInterval: 400 + rng.between(0, 300),
          clapFrame: 0,
        });
      }
    }
    // A few at the ends too
    for (let side = -1; side <= 1; side += 2) {
      for (let s = 0; s < 4; s++) {
        const sx = soccerX + side * (fieldW / 2 + 35 + rng.between(0, 15));
        const sy = soccerY - 60 + s * 40;
        const skinId = rng.between(0, 9);
        const sprite = this.add
          .image(sx, sy, `person-wave1-${skinId}`)
          .setScale(SCALE)
          .setDepth(2);
        const personEntry2 = {
          sprite,
          skinId,
          state: "idle",
          greeting: rng.pick(cheerPhrases),
          noGreet: true,
          scatterPanic: true,
          isSoccerSpectator: true,
          bubble: null,
          waveTimer: 0,
          waveFrame: 0,
          runAngle: 0,
          runTimer: 0,
          runFrame: 0,
          wanderTimer: 0,
          wanderDuration: 999,
          wanderAngle: null,
          hideTarget: null,
          homeX: sx,
          homeY: sy,
        };
        this.people.push(personEntry2);
        this.soccerSpectators.push({
          sprite,
          skinId,
          personEntry: personEntry2,
          clapTimer: rng.between(0, 500),
          clapInterval: 400 + rng.between(0, 300),
          clapFrame: 0,
        });
      }
    }

    // ==========================================
    // BUILDINGS — tracked for destruction
    // ==========================================
    // sizes: "small"=2hp, "medium"=3hp, "large"=4hp
    this.buildings = [];
    const bldgHp = { small: 2, medium: 3, large: 4 };
    const bldgRadius = { small: 30, medium: 50, large: 60 };

    const addBuilding = (x, y, tex, size, tint) => {
      const sprite = this.add.image(x, y, tex).setScale(SCALE).setDepth(2);
      if (tint) sprite.setTint(tint);
      const b = {
        sprite,
        tex,
        size,
        hp: bldgHp[size],
        maxHp: bldgHp[size],
        radius: bldgRadius[size],
        x,
        y,
        destroyed: false,
        cracksSprite: null,
        fireSprites: [],
      };
      this.buildings.push(b);
      return b;
    };

    // ==========================================
    // TOWN (NW quadrant) — large grid layout
    // ==========================================
    const roadTile = TILE * SCALE;
    const townStartX = 100;
    const townStartY = 100;
    const blockSize = 6;
    const gridCols = 8;
    const gridRows = 8;
    const roadSpacing = blockSize + 1;

    // Lay roads
    const townW = gridCols * roadSpacing + 1;
    const townH = gridRows * roadSpacing + 1;
    for (let gy = 0; gy < townH; gy++) {
      for (let gx = 0; gx < townW; gx++) {
        const px = townStartX + gx * roadTile;
        const py = townStartY + gy * roadTile;
        const isHRoad = gy % roadSpacing === 0;
        const isVRoad = gx % roadSpacing === 0;
        if (isHRoad && isVRoad) {
          this.add
            .image(px, py, "road-x")
            .setOrigin(0, 0)
            .setScale(SCALE)
            .setDepth(1);
        } else if (isHRoad) {
          this.add
            .image(px, py, "road-h")
            .setOrigin(0, 0)
            .setScale(SCALE)
            .setDepth(1);
        } else if (isVRoad) {
          this.add
            .image(px, py, "road-v")
            .setOrigin(0, 0)
            .setScale(SCALE)
            .setDepth(1);
        }
      }
    }

    // Fill each block with buildings
    const blockTypes = [
      "residential",
      "residential",
      "residential",
      "residential",
      "commercial",
      "commercial",
      "commercial",
      "park",
      "parking",
    ];
    const houseTints = [0xddccbb, 0xccbbaa, 0xbbccdd, 0xddddcc, 0xeeddcc];

    // Bazaar block coords (skip these during normal building generation)
    const bazaarSet = new Set(["3,3", "4,3", "5,3", "3,4", "4,4"]);

    for (let by = 0; by < gridRows; by++) {
      for (let bx = 0; bx < gridCols; bx++) {
        const blkX = townStartX + (bx * roadSpacing + 1) * roadTile;
        const blkY = townStartY + (by * roadSpacing + 1) * roadTile;
        const blkW = blockSize * roadTile;
        const blkH = blockSize * roadTile;
        const cx = blkX + blkW / 2;
        const cy = blkY + blkH / 2;

        // Skip bazaar blocks — filled separately
        if (bazaarSet.has(`${bx},${by}`)) continue;

        if (bx === 3 && by === 2) {
          addBuilding(cx, cy, "hospital", "large");
          for (let pp = 0; pp < 3; pp++) {
            this.add
              .image(blkX + pp * roadTile, blkY, "parking")
              .setOrigin(0, 0)
              .setScale(SCALE)
              .setDepth(1);
          }
          continue;
        }
        if (bx === 5 && by === 4) {
          addBuilding(cx, cy, "church", "medium");
          for (let pp = 0; pp < 3; pp++) {
            for (let pq = 0; pq < 3; pq++) {
              this.add
                .image(blkX + pp * roadTile, blkY + pq * roadTile, "park")
                .setOrigin(0, 0)
                .setScale(SCALE)
                .setDepth(1);
            }
          }
          continue;
        }

        const blockType = rng.pick(blockTypes);

        if (blockType === "park") {
          for (let py2 = 0; py2 < blockSize; py2++) {
            for (let px2 = 0; px2 < blockSize; px2++) {
              this.add
                .image(blkX + px2 * roadTile, blkY + py2 * roadTile, "park")
                .setOrigin(0, 0)
                .setScale(SCALE)
                .setDepth(1);
            }
          }
        } else if (blockType === "parking") {
          for (let py2 = 0; py2 < blockSize; py2++) {
            for (let px2 = 0; px2 < blockSize; px2++) {
              this.add
                .image(blkX + px2 * roadTile, blkY + py2 * roadTile, "parking")
                .setOrigin(0, 0)
                .setScale(SCALE)
                .setDepth(1);
            }
          }
          const tex = rng.pick(["building", "shop", "gas-station"]);
          const sz = tex === "building" ? "medium" : "small";
          addBuilding(blkX + roadTile, blkY + roadTile, tex, sz);
        } else if (blockType === "commercial") {
          const spots = [];
          for (let sy = 0; sy < 2; sy++) {
            for (let sx = 0; sx < 2; sx++) {
              spots.push({
                x: blkX + (sx * 3 + 1) * roadTile,
                y: blkY + (sy * 3 + 1) * roadTile,
              });
            }
          }
          for (const s of spots) {
            const tex = rng.pick([
              "building",
              "apartment",
              "shop",
              "shop",
              "gas-station",
            ]);
            const sz =
              tex === "building" || tex === "apartment" ? "medium" : "small";
            addBuilding(s.x, s.y, tex, sz);
          }
        } else {
          for (let hy = 0; hy < 3; hy++) {
            for (let hx = 0; hx < 3; hx++) {
              if (rng.frac() < 0.15) continue;
              const houseX = blkX + (hx * 2 + 0.5) * roadTile;
              const houseY = blkY + (hy * 2 + 0.5) * roadTile;
              addBuilding(
                houseX,
                houseY,
                "house",
                "small",
                rng.pick(houseTints),
              );
            }
          }
        }
      }
    }

    // ==========================================
    // BAZAAR (5 blocks in center of town)
    // ==========================================
    const bazaarBlocks = [
      { bx: 3, by: 3 }, { bx: 4, by: 3 }, { bx: 5, by: 3 },
      { bx: 3, by: 4 }, { bx: 4, by: 4 },
    ];
    const goodsTextures = ["goods-basket", "goods-jug", "goods-cloth", "goods-fruit", "goods-bread"];
    const stallTextures = ["stall", "stall2", "stall3"];

    for (const bb of bazaarBlocks) {
      const blkX = townStartX + (bb.bx * roadSpacing + 1) * roadTile;
      const blkY = townStartY + (bb.by * roadSpacing + 1) * roadTile;
      const blkW = blockSize * roadTile;
      const blkH = blockSize * roadTile;

      // Place stalls in rows
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          const sx = blkX + (col * 3 + 1) * roadTile;
          const sy = blkY + (row * 2 + 0.5) * roadTile;
          const tex = rng.pick(stallTextures);
          this.add.image(sx, sy, tex).setScale(SCALE).setDepth(2);
        }
      }

      // Place 1-2 tents per block
      const tentX = blkX + blkW * 0.5;
      const tentY = blkY + blkH - roadTile;
      this.add.image(tentX, tentY, "tent").setScale(SCALE).setDepth(2);

      // Merchants (standing behind stalls, don't wander)
      for (let m = 0; m < 3; m++) {
        const mx = blkX + (m * 2 + 1) * roadTile;
        const my = blkY + roadTile * 0.5;
        const skinId = rng.between(0, 9);
        const sprite = this.add.image(mx, my, `person-stand-${skinId}`)
          .setScale(SCALE).setDepth(3);
        this.people.push({
          sprite, skinId, state: "idle",
          greeting: rng.pick(merchantGreetings),
          bubble: null, waveTimer: 0, waveFrame: 0,
          runAngle: 0, runTimer: 0, runFrame: 0,
          wanderTimer: 0, wanderDuration: 999, wanderAngle: null,
          hideTarget: null, homeX: mx, homeY: my,
        });
      }

      // Shoppers wandering the block (carrying goods)
      for (let s = 0; s < 6; s++) {
        const sx = blkX + Math.random() * blkW;
        const sy = blkY + Math.random() * blkH;
        const skinId = rng.between(0, 9);
        const sprite = this.add.image(sx, sy, `person-stand-${skinId}`)
          .setScale(SCALE).setDepth(2);

        // Carried item follows the person
        const goodsTex = rng.pick(goodsTextures);
        const goodsSprite = this.add.image(sx + 8, sy - 5, goodsTex)
          .setScale(SCALE * 0.8).setDepth(3);

        this.people.push({
          sprite, skinId, state: "idle",
          greeting: rng.pick(shopperGreetings),
          bubble: null, waveTimer: 0, waveFrame: 0,
          runAngle: 0, runTimer: 0, runFrame: 0,
          wanderTimer: 0,
          wanderDuration: 2 + Math.random() * 3,
          wanderAngle: Math.random() * Math.PI * 2,
          hideTarget: null, homeX: sx, homeY: sy,
          carriedGoods: goodsSprite,
        });
      }
    }

    // ==========================================
    // FARM (NE quadrant) — single farm compound
    // ==========================================
    const farmX = halfW * SCALE + 600;
    const farmY = halfH * SCALE * 0.4;

    // Farmhouse (main house)
    addBuilding(farmX, farmY, "house", "small", 0xddccaa);

    // Barn (large, to the right)
    addBuilding(farmX + 250, farmY - 20, "barn", "medium");

    // Silos near the barn
    addBuilding(farmX + 380, farmY - 60, "silo", "small");
    addBuilding(farmX + 420, farmY - 30, "silo", "small");
    addBuilding(farmX + 400, farmY + 20, "silo", "small");

    // Small huts scattered around
    addBuilding(farmX - 150, farmY + 100, "hut", "small");
    addBuilding(farmX + 80, farmY + 140, "hut", "small");
    addBuilding(farmX - 80, farmY - 120, "hut", "small");

    // Corral (livestock pen)
    this.add.image(farmX + 150, farmY + 150, "corral")
      .setScale(SCALE).setDepth(1.5);

    // Hay bale piles
    const hayPositions = [
      { x: farmX + 300, y: farmY + 80 },
      { x: farmX + 320, y: farmY + 100 },
      { x: farmX + 290, y: farmY + 110 },
      { x: farmX - 200, y: farmY - 40 },
      { x: farmX - 180, y: farmY - 20 },
      { x: farmX + 50, y: farmY - 80 },
      { x: farmX + 70, y: farmY - 70 },
      { x: farmX + 60, y: farmY - 60 },
    ];
    for (const hp of hayPositions) {
      this.add.image(hp.x, hp.y, "hay").setScale(SCALE).setDepth(2);
    }

    // Fences around the farm perimeter (with gate gaps)
    const fenceLen = TILE * SCALE;
    // Top fence (gap at f=1 for gate)
    for (let f = -6; f <= 8; f++) {
      if (f === 1) continue;
      this.add.image(farmX + f * fenceLen, farmY - 180, "fence-h")
        .setScale(SCALE).setDepth(1.5);
    }
    // Bottom fence (gap at f=2 for gate)
    for (let f = -6; f <= 8; f++) {
      if (f === 2) continue;
      this.add.image(farmX + f * fenceLen, farmY + 200, "fence-h")
        .setScale(SCALE).setDepth(1.5);
    }
    // Left fence (gap at f=0 for gate)
    for (let f = -4; f <= 4; f++) {
      if (f === 0) continue;
      this.add.image(farmX - 6 * fenceLen, farmY + f * fenceLen, "fence-v")
        .setScale(SCALE).setDepth(1.5);
    }
    // Right fence (gap at f=1 for gate)
    for (let f = -4; f <= 4; f++) {
      if (f === 1) continue;
      this.add.image(farmX + 8 * fenceLen + 10, farmY + f * fenceLen, "fence-v")
        .setScale(SCALE).setDepth(1.5);
    }

    // ==========================================
    // ANIMAL CORRALS (outside the farm compound)
    // ==========================================
    this.animals = [];

    const corralDefs = [
      { cx: farmX - 400, cy: farmY - 100, animal: "pig", count: 6 },
      { cx: farmX - 400, cy: farmY + 120, animal: "chicken", count: 10 },
      { cx: farmX + 550, cy: farmY - 100, animal: "camel", count: 4 },
      { cx: farmX + 550, cy: farmY + 120, animal: "goat", count: 6 },
    ];

    const corralW = 32 * SCALE;
    const corralH = 24 * SCALE;

    for (const cd of corralDefs) {
      // Draw the corral fence
      this.add.image(cd.cx, cd.cy, "corral").setScale(SCALE).setDepth(1.5);

      // Spawn animals inside
      for (let a = 0; a < cd.count; a++) {
        const ax = cd.cx + Phaser.Math.Between(-corralW / 2 + 15, corralW / 2 - 15);
        const ay = cd.cy + Phaser.Math.Between(-corralH / 2 + 10, corralH / 2 - 10);
        const sprite = this.add.image(ax, ay, cd.animal)
          .setScale(SCALE).setDepth(2);
        this.animals.push({
          sprite,
          type: cd.animal,
          state: "idle", // idle | panicking | dead
          corral: { x: cd.cx, y: cd.cy, hw: corralW / 2, hh: corralH / 2 },
          wanderAngle: Math.random() * Math.PI * 2,
          wanderTimer: 0,
          wanderDuration: 1 + Math.random() * 3,
          moving: Math.random() > 0.5,
          runAngle: 0,
          panicTimer: 0,
        });
      }
    }

    // ==========================================
    // GOAT FLOCK WITH SHEPHERDS (right of farm)
    // ==========================================
    const flockX = farmX + 900;
    const flockY = farmY;
    const flockRadius = 200;

    // Large goat flock (20 goats)
    for (let g = 0; g < 20; g++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * flockRadius * 0.8;
      const gx = flockX + Math.cos(angle) * dist;
      const gy = flockY + Math.sin(angle) * dist;
      const sprite = this.add.image(gx, gy, "goat").setScale(SCALE).setDepth(2);
      this.animals.push({
        sprite,
        type: "goat",
        state: "idle",
        corral: { x: flockX, y: flockY, hw: flockRadius, hh: flockRadius },
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        wanderDuration: 1 + Math.random() * 3,
        moving: Math.random() > 0.5,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        panicTimer: 0,
      });
    }

    // Shepherds (3, spread around the flock edges)
    // shepherdGreetings imported from dialog.js
    const shepherdPositions = [
      { x: flockX - 160, y: flockY - 80 },
      { x: flockX + 170, y: flockY + 60 },
      { x: flockX - 40, y: flockY + 170 },
    ];
    for (const sp of shepherdPositions) {
      const skinId = rng.pick([4, 5, 7, 9]); // earthy/pastoral skin variants
      const sprite = this.add.image(sp.x, sp.y, `person-stand-${skinId}`)
        .setScale(SCALE).setDepth(2);
      this.people.push({
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(shepherdGreetings),
        noGreet: false,
        scatterPanic: true,
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 3 + Math.random() * 4,
        wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
        hideTarget: null,
        homeX: sp.x,
        homeY: sp.y,
      });
    }

    // ==========================================
    // OILFIELD (below the farm, NE area — large)
    // ==========================================
    const oilX = farmX + 200;
    const oilY = farmY + 800;

    // Oil tanks (spread across the field)
    this.oilWells = [];
    const tankPositions = [
      { x: oilX - 500, y: oilY - 200 },
      { x: oilX + 100, y: oilY - 250 },
      { x: oilX + 500, y: oilY - 150 },
      { x: oilX - 300, y: oilY + 300 },
      { x: oilX + 300, y: oilY + 250 },
      { x: oilX + 600, y: oilY + 100 },
      { x: oilX - 100, y: oilY + 450 },
      { x: oilX + 500, y: oilY + 450 },
    ];
    for (const tp of tankPositions) {
      const b = addBuilding(tp.x, tp.y, "oil-tank", "large");
      b.isOilInfra = true;
    }

    // Oil wells (many, spread across a large area)
    const wellPositions = [];
    for (let wy = -2; wy <= 3; wy++) {
      for (let wx = -3; wx <= 3; wx++) {
        // Skip positions too close to tanks
        const wpx = oilX + wx * 200 + Phaser.Math.Between(-40, 40);
        const wpy = oilY + wy * 180 + Phaser.Math.Between(-40, 40);
        let tooClose = false;
        for (const tp of tankPositions) {
          if (Phaser.Math.Distance.Between(wpx, wpy, tp.x, tp.y) < 100) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) wellPositions.push({ x: wpx, y: wpy });
      }
    }
    for (const wp of wellPositions) {
      const sprite = this.add.image(wp.x, wp.y, "oil-well1")
        .setScale(SCALE).setDepth(2);
      const well = {
        sprite,
        x: wp.x, y: wp.y,
        alive: true,
        pumpFrame: 0,
        pumpTimer: 0,
        pumpSpeed: 600 + Math.random() * 400,
      };
      this.oilWells.push(well);
      this.buildings.push({
        sprite, tex: "oil-well1", size: "small",
        hp: 1, maxHp: 1, radius: 30,
        x: wp.x, y: wp.y, destroyed: false,
        cracksSprite: null, fireSprites: [],
        isOilWell: true, wellRef: well, isOilInfra: true,
      });
    }

    // Pipes connecting in a grid
    const pipeFn = TILE * SCALE;
    // Horizontal pipe runs at multiple Y levels
    for (const pipeY of [-200, -30, 120, 280, 440]) {
      for (let px = -16; px <= 16; px++) {
        this.add.image(oilX + px * pipeFn, oilY + pipeY, "pipe-h")
          .setScale(SCALE).setDepth(1.5);
      }
    }
    // Vertical pipe runs
    for (const vx of [-500, -300, -100, 100, 300, 500]) {
      for (let py = -5; py <= 10; py++) {
        this.add.image(oilX + vx, oilY - 200 + py * pipeFn, "pipe-v")
          .setScale(SCALE).setDepth(1.5);
      }
    }

    // Oil field workers (hard hat skins 10-11)
    // workerGreetings imported from dialog.js
    for (let w = 0; w < 25; w++) {
      const wx = oilX + Phaser.Math.Between(-600, 600);
      const wy = oilY + Phaser.Math.Between(-250, 500);
      const skinId = 10 + (w % 2);
      const sprite = this.add.image(wx, wy, `person-stand-${skinId}`)
        .setScale(SCALE).setDepth(2);
      this.people.push({
        sprite, skinId, state: "idle",
        greeting: rng.pick(workerGreetings),
        bubble: null, waveTimer: 0, waveFrame: 0,
        runAngle: 0, runTimer: 0, runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 2 + Math.random() * 4,
        wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
        hideTarget: null, homeX: wx, homeY: wy,
        scatterPanic: true,
      });
    }

    // --- Runway (6 tiles long) ---
    const rwX = (WORLD_W * SCALE) / 2;
    const rwTiles = 6;
    const rwTileH = 128 * SCALE;
    const rwTotalH = rwTiles * rwTileH;
    // Runway bottom edge
    const rwBottom = (WORLD_H * SCALE) / 2 + rwTotalH / 2;
    const rwTop = rwBottom - rwTotalH;
    const rwCenterY = (rwTop + rwBottom) / 2;
    for (let i = 0; i < rwTiles; i++) {
      this.add
        .image(rwX, rwTop + i * rwTileH + rwTileH / 2, "runway")
        .setScale(SCALE)
        .setDepth(1.5);
    }
    // Store runway bounds for collision
    this.runway = {
      x: rwX,
      y: rwCenterY,
      halfW: (32 * SCALE) / 2,
      halfH: rwTotalH / 2,
    };

    // --- Hangar (to the right of the runway bottom) ---
    const hangarOffset = (48 * SCALE) / 2 + (32 * SCALE) / 2 + 16 * SCALE * 3; // hangar half + runway half + taxiway gap
    this.hangarX = rwX + hangarOffset;
    this.hangarY = rwBottom - (48 * SCALE) / 2;
    this.add
      .image(this.hangarX, this.hangarY, "hangar")
      .setScale(SCALE)
      .setDepth(1.5);

    // --- Taxiway connecting hangar door to runway ---
    const taxiStartX = rwX + (32 * SCALE) / 2; // right edge of runway
    const taxiEndX = this.hangarX - (48 * SCALE) / 2; // left edge of hangar (door side)
    const taxiY = this.hangarY;
    for (let tx = taxiStartX; tx < taxiEndX; tx += 16 * SCALE) {
      this.add
        .image(tx + 8 * SCALE, taxiY, "taxiway")
        .setScale(SCALE)
        .setAngle(90) // rotate so center line runs horizontally
        .setDepth(1.5);
    }

    // --- People (random wanderers) ---
    // greetings imported from dialog.js
    const droneStartX = rwX;
    const droneStartY = rwBottom - 80;
    for (let i = 0; i < 60; i++) {
      let px, py;
      do {
        px = rng.between(300, WORLD_W * SCALE - 300);
        py = rng.between(300, WORLD_H * SCALE - 300);
      } while (
        Phaser.Math.Distance.Between(px, py, droneStartX, droneStartY) < 2000
      );
      const skinId = rng.between(0, 9);
      const sprite = this.add
        .image(px, py, `person-stand-${skinId}`)
        .setScale(SCALE)
        .setDepth(2);
      this.people.push({
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(greetings),
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 2 + Math.random() * 4,
        wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
        hideTarget: null,
        homeX: px,
        homeY: py,
      });
    }

    // --- Town people (extra population in the NW town area) ---
    const townEndX = townStartX + townW * roadTile;
    const townEndY = townStartY + townH * roadTile;
    for (let i = 0; i < 80; i++) {
      const px = townStartX + 50 + Math.random() * (townEndX - townStartX - 100);
      const py = townStartY + 50 + Math.random() * (townEndY - townStartY - 100);
      const skinId = rng.between(0, 9);
      const sprite = this.add
        .image(px, py, `person-stand-${skinId}`)
        .setScale(SCALE)
        .setDepth(2);
      this.people.push({
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(greetings),
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 2 + Math.random() * 4,
        wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
        hideTarget: null,
        homeX: px,
        homeY: py,
      });
    }

    // --- Town cars ---
    this.townCars = [];
    const carNames = ["car-white", "car-black", "car-grey", "car-red", "car-blue", "car-green", "car-tan"];

    // Build road waypoint grid (intersections)
    this.townRoadNodes = [];
    const townRoadNodes = this.townRoadNodes;
    this.townRoadSpacing = roadSpacing;
    this.townRoadTile = roadTile;
    this.townStartX = townStartX;
    this.townStartY = townStartY;
    this.townGridCols = gridCols;
    this.townGridRows = gridRows;
    for (let ry = 0; ry <= gridRows; ry++) {
      for (let rx = 0; rx <= gridCols; rx++) {
        townRoadNodes.push({
          x: townStartX + rx * roadSpacing * roadTile + roadTile / 2,
          y: townStartY + ry * roadSpacing * roadTile + roadTile / 2,
        });
      }
    }

    for (let ci = 0; ci < 15; ci++) {
      // Start at a random intersection
      const startNode = Phaser.Utils.Array.GetRandom(townRoadNodes);
      const carTex = Phaser.Utils.Array.GetRandom(carNames);
      const passengers = Phaser.Math.Between(1, 4);
      const sprite = this.add.image(startNode.x, startNode.y, carTex)
        .setScale(SCALE).setDepth(2);
      this.townCars.push({
        sprite,
        tex: carTex,
        passengers,
        alive: true,
        // Current position on road grid
        currentNode: { ...startNode },
        targetNode: null,
        speed: 40 + Math.random() * 30,
        heading: 0,
      });
    }

    // --- Dirt bikers ---
    this.dirtBikers = [];
    for (let bi = 0; bi < 8; bi++) {
      const bx = Phaser.Math.Between(500, WORLD_W * SCALE - 500);
      const by = Phaser.Math.Between(500, WORLD_H * SCALE - 500);
      const sprite = this.add.image(bx, by, "dirtbike")
        .setScale(SCALE).setDepth(3);
      // Dust trail emitter reference
      this.dirtBikers.push({
        sprite,
        heading: Math.random() * Math.PI * 2,
        speed: 100 + Math.random() * 60,
        targetX: bx,
        targetY: by,
        retargetTimer: 0,
        bounceFrame: 0,
        bounceTimer: 0,
        dustTimer: 0,
        alive: true,
      });
    }

    // --- Drone shadow ---
    this.droneShadow = this.add
      .image(0, 0, "drone-shadow")
      .setScale(SCALE)
      .setDepth(3)
      .setAlpha(0.3);

    // --- Drone (starts at bottom of runway) ---
    this.drone = this.add
      .image(rwX, rwBottom - 80, "drone")
      .setScale(SCALE)
      .setDepth(10);

    // Propeller animation timer
    this.propFrame = 0;
    this.propTimer = 0;

    // Flight state: "grounded" | "airborne" | "crashed"
    this.flightState = "grounded";

    // Drone state
    this.droneState = {
      x: this.drone.x,
      y: this.drone.y,
      angle: 0, // degrees, 0 = up/north
      speed: 0, // start stationary on runway
      altitude: 0, // on the ground
      minAlt: 0,
      maxAlt: 8000,
      minSpeed: 0,
      maxSpeed: 300,
    };

    // --- Targeting ---
    this.targetPos = null;
    this.reticle = this.add
      .image(0, 0, "reticle")
      .setScale(SCALE)
      .setDepth(8)
      .setVisible(false);
    this.laserLine = this.add.graphics().setDepth(7);

    // --- Missiles ---
    this.missiles = [];

    // --- Explosions ---
    this.anims.create({
      key: "explode",
      frames: [
        { key: "explosion-sheet", frame: 0 },
        { key: "explosion-sheet", frame: 1 },
        { key: "explosion-sheet", frame: 2 },
        { key: "explosion-sheet", frame: 3 },
        { key: "explosion-sheet", frame: 4 },
      ],
      frameRate: 10,
      repeat: 0,
    });

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, WORLD_W * SCALE, WORLD_H * SCALE);
    this.cameras.main.startFollow(this.drone, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    // --- Input ---
    this.cursors = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      altUp: Phaser.Input.Keyboard.KeyCodes.E,
      altDown: Phaser.Input.Keyboard.KeyCodes.Q,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Also allow arrow keys

    // Click to set target
    this.input.on("pointerdown", (pointer) => {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      this.targetPos = { x: worldX, y: worldY };
      this.reticle.setPosition(worldX, worldY).setVisible(true);
    });

    // --- HUD camera (separate, unaffected by zoom) ---
    this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.hudCam.setScroll(0, 0);

    // --- HUD elements ---
    this.hudText = this.add
      .text(10, 10, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#0f0",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
      })
      .setDepth(100);

    this.controlsText = this.add
      .text(10, 0, "WASD:turn/speed  E/Q:alt  Click:target  Space:fire", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#0f0",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 4 },
      })
      .setDepth(100);

    // Main camera ignores HUD, HUD camera only sees HUD
    this.cameras.main.ignore([this.hudText, this.controlsText]);
    this.hudCam.ignore(
      this.children.list.filter(
        (child) => child !== this.hudText && child !== this.controlsText,
      ),
    );

    // Reposition on resize
    this.scale.on("resize", (gameSize) => {
      this.controlsText.setY(gameSize.height - 30);
      this.hudCam.setSize(gameSize.width, gameSize.height);
    });
    this.controlsText.setY(this.scale.height - 30);

    // Kill counter
    this.kills = 0;

    // --- Music ---
    this.initMusic();
    this.initSfx();

    // --- Intro cutscene ---
    this.introPlaying = true;
    this.playIntroCutscene();
  }

  initMusic() {
    this.musicTracks = [];
    this.musicStarted = false;
    this.currentTrack = null;
    this.lastTrackKey = null;

    // Force-unlock audio context
    if (this.sound.context) {
      this.sound.context.resume();
    }

    fetch("/music/tracks.json")
      .then((res) => res.json())
      .then((tracks) => {
        if (!tracks || tracks.length === 0) return;
        this.musicTracks = tracks;

        for (const filename of tracks) {
          this.load.audio(`music-${filename}`, `/music/${filename}`);
        }
        this.load.once("complete", () => {
          // Resume again in case it was suspended
          if (this.sound.context) this.sound.context.resume();
          this.playRandomTrack();
        });
        this.load.start();
      })
      .catch(() => {});

    // If sound is locked by browser, start music as soon as it unlocks
    if (this.sound.locked) {
      this.sound.once("unlocked", () => {
        if (this.musicTracks.length > 0 && !this.musicStarted) {
          this.playRandomTrack();
        }
      });
    }
  }

  playRandomTrack() {
    if (this.musicTracks.length === 0) return;

    // Pick a track that isn't the last one played
    let candidates = this.musicTracks.filter(
      (t) => `music-${t}` !== this.lastTrackKey,
    );
    if (candidates.length === 0) candidates = this.musicTracks;
    const filename = Phaser.Utils.Array.GetRandom(candidates);
    const key = `music-${filename}`;

    // Stop current track
    if (this.currentTrack) {
      this.currentTrack.stop();
    }

    this.currentTrack = this.sound.add(key, { volume: 0.4 });
    this.currentTrack.play();
    this.lastTrackKey = key;

    // When it ends, play another
    this.currentTrack.once("complete", () => {
      this.playRandomTrack();
    });
  }

  initSfx() {
    this.sfx = { missileLaunch: [], explosion: [] };

    const loadCategory = (category, path) => {
      fetch(`${path}/sounds.json`)
        .then((res) => res.json())
        .then((files) => {
          if (!files || files.length === 0) return;
          for (const filename of files) {
            const key = `sfx-${category}-${filename}`;
            this.load.audio(key, `${path}/${filename}`);
          }
          this.load.once("complete", () => {
            for (const filename of files) {
              this.sfx[category].push(`sfx-${category}-${filename}`);
            }
          });
          this.load.start();
        })
        .catch(() => {});
    };

    loadCategory("missileLaunch", "/sfx/missileLaunch");
    loadCategory("explosion", "/sfx/explosion");

    // Engine loop — two instances crossfaded for seamless looping
    this.engineKey = null;
    this.engineA = null;
    this.engineB = null;
    this.engineActive = null; // which instance is currently primary
    this.engineCrossfade = 0.5; // seconds of crossfade overlap
    fetch("/sfx/engine/sounds.json")
      .then((res) => res.json())
      .then((files) => {
        if (!files || files.length === 0) return;
        const filename = files[0];
        const key = `sfx-engine-${filename}`;
        this.engineKey = key;
        this.load.audio(key, `/sfx/engine/${filename}`);
        this.load.once("complete", () => {
          this.engineA = this.sound.add(key, {
            volume: 0,
            loop: false,
            rate: 0.6,
          });
          this.engineB = this.sound.add(key, {
            volume: 0,
            loop: false,
            rate: 0.6,
          });
          this.engineActive = null;
        });
        this.load.start();
      })
      .catch(() => {});
  }

  playSfx(category, volume = 0.5) {
    const keys = this.sfx[category];
    if (!keys || keys.length === 0) return;
    const key = Phaser.Utils.Array.GetRandom(keys);
    this.sound.play(key, { volume });
  }

  playSfxAt(category, x, y, maxVolume = 0.7) {
    const keys = this.sfx[category];
    if (!keys || keys.length === 0) return;
    const key = Phaser.Utils.Array.GetRandom(keys);

    const ds = this.droneState;
    const dist = Phaser.Math.Distance.Between(ds.x, ds.y, x, y);

    // Volume falls off with distance (full at 0, silent at ~2000px)
    const maxDist = 2000;
    const volume = maxVolume * Phaser.Math.Clamp(1 - dist / maxDist, 0.05, 1);

    // Pan based on horizontal angle from drone (-1 left, +1 right)
    // Account for drone's heading so it's relative to the drone's facing direction
    const angleToExplosion = Phaser.Math.Angle.Between(ds.x, ds.y, x, y);
    const droneRad = Phaser.Math.DegToRad(ds.angle - 90);
    const relAngle = angleToExplosion - droneRad;
    const pan = Phaser.Math.Clamp(Math.sin(relAngle) * 0.25, -0.25, 0.25);

    const sfx = this.sound.add(key, { volume });
    sfx.play({ pan });
    sfx.once("complete", () => sfx.destroy());
  }

  // Get the correct texture prefix for a person (team jersey or regular skin)
  skinPrefix(p) {
    return p.teamSkin || `person`;
  }
  skinTex(p, type) {
    if (p.teamSkin) return `${p.teamSkin}-${type}`;
    return `person-${type}-${p.skinId}`;
  }

  playIntroCutscene() {
    const ds = this.droneState;
    // Little guy starts at the hangar door (left side of hangar)
    const guyStartX = this.hangarX - (48 * SCALE) / 2;
    const guyStartY = this.hangarY;
    const guyTargetX = ds.x + 30; // stop near the nose
    const guyTargetY = ds.y - 30; // nose is at the top of the drone

    const guy = this.add
      .image(guyStartX, guyStartY, "guy1")
      .setScale(SCALE)
      .setDepth(10);
    this.hudCam.ignore(guy);

    // Walk animation
    let walkFrame = 0;
    const walkAnim = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        walkFrame = 1 - walkFrame;
        guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
      },
    });

    // Walk to the drone nose
    this.tweens.add({
      targets: guy,
      x: guyTargetX,
      y: guyTargetY,
      duration: 2000,
      ease: "Quad.easeOut",
      onComplete: () => {
        // Stop walking
        walkAnim.remove();
        guy.setTexture("guy1");

        // Spawn kiss hearts
        for (let i = 0; i < 5; i++) {
          const heart = this.add
            .image(guyTargetX, guyTargetY - 10, "heart")
            .setScale(SCALE)
            .setDepth(12);
          this.hudCam.ignore(heart);
          const angle =
            -Math.PI * 0.2 +
            (i / 4) * -Math.PI * 0.6 +
            (Math.random() - 0.5) * 0.5;
          const dist = 80 + Math.random() * 60;
          this.tweens.add({
            targets: heart,
            x: guyTargetX + Math.cos(angle) * dist,
            y: guyTargetY + Math.sin(angle) * dist - 40,
            scale: SCALE * (0.6 + Math.random() * 0.6),
            alpha: 0,
            duration: 1000 + Math.random() * 500,
            delay: i * 200,
            ease: "Quad.easeOut",
            onComplete: () => heart.destroy(),
          });
        }

        // Speech bubble — cycles through lines
        const introLine = Phaser.Utils.Array.GetRandom(introLines);
        const bubble = this.add
          .text(guyTargetX + 40, guyTargetY - 40, introLine, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#000",
            backgroundColor: "#fff",
            padding: { x: 8, y: 6 },
          })
          .setDepth(13)
          .setScale(SCALE * 0.6);
        this.hudCam.ignore(bubble);

        // After a pause, guy walks away
        this.time.delayedCall(2500, () => {
          bubble.destroy();

          // Walk away
          const walkAnim2 = this.time.addEvent({
            delay: 150,
            loop: true,
            callback: () => {
              walkFrame = 1 - walkFrame;
              guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
            },
          });

          this.tweens.add({
            targets: guy,
            x: this.hangarX - (48 * SCALE) / 2,
            y: this.hangarY,
            duration: 2000,
            ease: "Quad.easeIn",
            onComplete: () => {
              walkAnim2.remove();
              guy.destroy();
              this.introPlaying = false;
            },
          });
        });
      },
    });
  }

  isOnRunway(x, y) {
    const rw = this.runway;
    return Math.abs(x - rw.x) < rw.halfW && Math.abs(y - rw.y) < rw.halfH;
  }

  crashDrone() {
    this.flightState = "crashed";
    this.droneState.speed = 0;
    this.droneState.altitude = 0;
    this.drone.setVisible(false);
    this.droneShadow.setVisible(false);

    // Stop engine sound
    if (this.engineA && this.engineA.isPlaying) this.engineA.stop();
    if (this.engineB && this.engineB.isPlaying) this.engineB.stop();
    this.engineActive = null;

    // Explosion at crash site
    this.missileImpact(this.droneState.x, this.droneState.y);
    this.cameras.main.shake(500, 0.015);

    // Show crash message
    this.crashText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        "DRONE DESTROYED\n\nPress R to restart",
        {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#f00",
          backgroundColor: "#000000cc",
          padding: { x: 20, y: 16 },
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(200);
    this.cameras.main.ignore(this.crashText);

    this.restartKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R,
    );
  }

  update(time, delta) {
    const dt = delta / 1000;
    const ds = this.droneState;

    // --- Intro cutscene playing ---
    if (this.introPlaying) return;

    // --- Crashed state ---
    if (this.flightState === "crashed") {
      if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.sound.stopAll();
        this.scene.restart();
      }
      this.updateMissiles(dt);
      return;
    }

    const isGrounded = this.flightState === "grounded";
    const isAirborne = this.flightState === "airborne";
    const speedKnots = ds.speed * 0.5;

    // --- Input: turn ---
    const turnRate = 120; // degrees/sec
    if (this.cursors.left.isDown) {
      ds.angle -= turnRate * dt;
    }
    if (this.cursors.right.isDown) {
      ds.angle += turnRate * dt;
    }

    // --- Input: speed ---
    const accel = 100; // px/s^2
    if (this.cursors.up.isDown) {
      ds.speed = Math.min(ds.maxSpeed, ds.speed + accel * dt);
    }
    if (this.cursors.down.isDown) {
      const minSpd = isAirborne ? 80 : 0; // 40 kts min when flying
      ds.speed = Math.max(minSpd, ds.speed - accel * dt);
    }

    // --- Input: altitude ---
    const altRate = 300; // feet/sec
    if (this.cursors.altUp.isDown) {
      // Can only gain altitude if speed >= 40 kts
      if (speedKnots >= 40) {
        ds.altitude = Math.min(ds.maxAlt, ds.altitude + altRate * dt);
        if (isGrounded) {
          this.flightState = "airborne";
        }
      }
    }
    if (this.cursors.altDown.isDown && isAirborne) {
      ds.altitude = Math.max(0, ds.altitude - altRate * dt);
    }

    // --- Check if drone touched down ---
    if (isAirborne && ds.altitude <= 0) {
      ds.altitude = 0;
      if (this.isOnRunway(ds.x, ds.y)) {
        // Safe landing
        this.flightState = "grounded";
      } else {
        // Crash!
        this.crashDrone();
        return;
      }
    }

    // --- Move drone ---
    const rad = Phaser.Math.DegToRad(ds.angle - 90);
    ds.x += Math.cos(rad) * ds.speed * dt;
    ds.y += Math.sin(rad) * ds.speed * dt;

    // Clamp to world bounds
    ds.x = Phaser.Math.Clamp(ds.x, 0, WORLD_W * SCALE);
    ds.y = Phaser.Math.Clamp(ds.y, 0, WORLD_H * SCALE);

    this.drone.setPosition(ds.x, ds.y);
    this.drone.setAngle(ds.angle);

    // --- Shadow (offset increases with altitude) ---
    if (ds.altitude > 0) {
      this.droneShadow.setVisible(true);
      const shadowOffset = ds.altitude * 0.04;
      this.droneShadow.setPosition(ds.x + shadowOffset, ds.y + shadowOffset);
      this.droneShadow.setAngle(ds.angle);
      this.droneShadow.setAlpha(
        Phaser.Math.Clamp(0.4 - ds.altitude * 0.0001, 0.05, 0.4),
      );
      const shadowScale =
        SCALE * Phaser.Math.Clamp(1.2 - ds.altitude * 0.0003, 0.6, 1.2);
      this.droneShadow.setScale(shadowScale);
    } else {
      this.droneShadow.setVisible(false);
    }

    // --- Camera zoom (zoom out above 2000 ft, drone compensates to stay same size) ---
    if (ds.altitude <= 2000) {
      this.cameras.main.setZoom(1);
      this.drone.setScale(SCALE);
    } else {
      const t = (ds.altitude - 2000) / (ds.maxAlt - 2000);
      const zoom = Phaser.Math.Linear(1.0, 0.65, t);
      this.cameras.main.setZoom(zoom);
      this.drone.setScale(SCALE / zoom);
    }

    // --- Propeller animation (faster spin at higher speed) ---
    if (ds.speed > 0) {
      const propInterval = Math.max(30, 150 - ds.speed * 0.4);
      this.propTimer += delta;
      if (this.propTimer >= propInterval) {
        this.propTimer = 0;
        this.propFrame = 1 - this.propFrame;
        this.drone.setTexture(this.propFrame === 0 ? "drone" : "drone2");
      }
    }

    // --- Engine sound (crossfaded loop, pitch shifts with speed) ---
    if (this.engineA && this.engineB) {
      const speedFrac = ds.speed / ds.maxSpeed;
      const targetRate = 0.6 + speedFrac * 0.8;
      const targetVol = ds.speed > 0 ? 0.04 + speedFrac * 0.07 : 0;
      const fade = this.engineCrossfade;

      // Start the first instance if nothing is playing and speed > 0
      if (ds.speed > 0 && !this.engineA.isPlaying && !this.engineB.isPlaying) {
        this.engineA.setRate(targetRate);
        this.engineA.setVolume(targetVol);
        this.engineA.play();
        this.engineActive = this.engineA;
      }

      // Update rate on both instances
      if (this.engineA.isPlaying) this.engineA.setRate(targetRate);
      if (this.engineB.isPlaying) this.engineB.setRate(targetRate);

      // Crossfade: when active instance nears its end, start the other and fade
      const active = this.engineActive;
      const other = active === this.engineA ? this.engineB : this.engineA;
      if (active && active.isPlaying && active.duration > 0) {
        const remaining = active.duration - active.seek;
        const fadeSec = fade / active.rate; // adjust for playback rate
        if (remaining < fadeSec && !other.isPlaying) {
          // Start the other instance and crossfade
          other.setRate(targetRate);
          other.setVolume(0);
          other.play();
          this.engineActive = other;
        }
        // Fade out active if near end
        if (remaining < fadeSec) {
          const t = remaining / fadeSec;
          active.setVolume(targetVol * t);
        } else {
          active.setVolume(targetVol);
        }
        // Fade in other if just started
        if (other.isPlaying && other.seek < fadeSec) {
          const t = other.seek / fadeSec;
          other.setVolume(targetVol * t);
        } else if (other.isPlaying && other === this.engineActive) {
          other.setVolume(targetVol);
        }
      }

      // Stop both if speed is 0
      if (ds.speed === 0) {
        if (this.engineA.isPlaying) this.engineA.stop();
        if (this.engineB.isPlaying) this.engineB.stop();
        this.engineActive = null;
      }
    }

    // --- Laser line from drone to target ---
    this.laserLine.clear();
    if (this.targetPos && isAirborne) {
      this.laserLine.lineStyle(1, 0xff0000, 0.5);
      this.laserLine.beginPath();
      this.laserLine.moveTo(ds.x, ds.y);
      this.laserLine.lineTo(this.targetPos.x, this.targetPos.y);
      this.laserLine.strokePath();

      const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
      this.reticle.setAlpha(pulse);
    }

    // --- Fire missile (only when airborne) ---
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.fire) &&
      this.targetPos &&
      isAirborne
    ) {
      this.fireMissile();
    }

    // --- Update missiles ---
    this.updateMissiles(dt);

    // --- Update people ---
    this.updatePeople(dt, delta);
    this.updateSoccer(dt, delta);
    this.updateAnimals(dt);
    this.updateOilWells(delta);
    this.updateDirtBikers(dt, delta);
    this.updateTownCars(dt);

    // --- HUD ---
    const spdDisplay = Math.round(speedKnots);
    let stateLabel = "";
    if (isGrounded) {
      stateLabel = ds.speed === 0 ? "PARKED" : "TAXIING";
      if (speedKnots >= 40) stateLabel = "READY (E to take off)";
    } else {
      stateLabel = "";
    }
    this.hudText.setText(
      `ALT: ${Math.round(ds.altitude)} ft  SPD: ${spdDisplay} kts\n` +
        `FREEDOMS: ${this.kills}  ${stateLabel}`,
    );
  }

  fireMissile() {
    if (!this.targetPos) return;

    // Launch from drone's nose in the direction it's facing
    const ds = this.droneState;
    const launchRad = Phaser.Math.DegToRad(ds.angle - 90);
    const launchOffset = 30;
    const startX = ds.x + Math.cos(launchRad) * launchOffset;
    const startY = ds.y + Math.sin(launchRad) * launchOffset;

    const missile = this.add
      .image(startX, startY, "missile")
      .setScale(SCALE)
      .setDepth(9);
    this.hudCam.ignore(missile);

    // Missile starts heading in the drone's direction
    const heading = launchRad;
    missile.setRotation(heading + Math.PI / 2);
    this.playSfx("missileLaunch", 0.25);

    this.missiles.push({
      sprite: missile,
      target: { x: this.targetPos.x, y: this.targetPos.y },
      speed: 280,
      heading, // current direction of travel (radians)
      turnRate: 3.0, // radians/sec max turn
      boostTime: 0.3, // seconds of straight flight before turning
      elapsed: 0,
      altitude: ds.altitude,
      launchAlt: ds.altitude, // remember starting altitude for scale calc
    });
  }

  updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.elapsed += dt;

      // Always track the current target point
      if (this.targetPos) {
        m.target.x = this.targetPos.x;
        m.target.y = this.targetPos.y;
      }

      const targetAngle = Phaser.Math.Angle.Between(
        m.sprite.x,
        m.sprite.y,
        m.target.x,
        m.target.y,
      );
      const dist = Phaser.Math.Distance.Between(
        m.sprite.x,
        m.sprite.y,
        m.target.x,
        m.target.y,
      );

      // After initial boost, steer toward target
      if (m.elapsed > m.boostTime && dist > 5) {
        let diff = Phaser.Math.Angle.Wrap(targetAngle - m.heading);
        const maxTurn = m.turnRate * dt;
        m.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
      }

      // Accelerate after boost phase
      if (m.elapsed > m.boostTime) {
        m.speed = Math.min(400, m.speed + 240 * dt);
      }

      m.sprite.x += Math.cos(m.heading) * m.speed * dt;
      m.sprite.y += Math.sin(m.heading) * m.speed * dt;
      m.sprite.setRotation(m.heading + Math.PI / 2);

      // Smoke trail
      m.smokeTimer = (m.smokeTimer || 0) + dt * 1000;
      if (m.smokeTimer > 40) {
        m.smokeTimer = 0;
        // Offset smoke to the back of the missile (opposite of heading)
        const smokeX = m.sprite.x - Math.cos(m.heading) * 12;
        const smokeY = m.sprite.y - Math.sin(m.heading) * 12;
        const puff = this.add
          .image(smokeX, smokeY, "smoke")
          .setScale(SCALE * (0.4 + Math.random() * 0.3))
          .setDepth(8)
          .setAlpha(0.6);
        this.hudCam.ignore(puff);
        this.tweens.add({
          targets: puff,
          alpha: 0,
          scale: SCALE * (0.8 + Math.random() * 0.4),
          x: puff.x + (Math.random() - 0.5) * 10,
          y: puff.y + (Math.random() - 0.5) * 10,
          duration: 400 + Math.random() * 200,
          onComplete: () => puff.destroy(),
        });
      }

      // Missile descends
      m.altitude = Math.max(0, m.altitude - 600 * dt);

      // Scale missile: full size at launch altitude, shrinks as it descends to ground
      const altFrac = m.launchAlt > 0 ? m.altitude / m.launchAlt : 0;
      const mScale = SCALE * (0.3 + altFrac * 0.7);
      m.sprite.setScale(mScale);

      if (dist < 15) {
        // Direct hit on target
        this.missileImpact(m.target.x, m.target.y);
        m.sprite.destroy();
        this.missiles.splice(i, 1);
      } else if (m.altitude <= 0) {
        // Ran out of altitude — impact where the missile actually is
        this.missileImpact(m.sprite.x, m.sprite.y);
        m.sprite.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }

  missileImpact(x, y) {
    // Explosion
    const exp = this.add
      .sprite(x, y, "explosion-sheet", 0)
      .setScale(SCALE * 2)
      .setDepth(11);
    this.hudCam.ignore(exp);
    exp.play("explode");
    exp.once("animationcomplete", () => exp.destroy());

    // Spawn cute symbols (randomized count, types, directions)
    const symbols = ["heart", "flower", "smiley", "star", "rainbow"];
    const count = Phaser.Math.Between(3, 12);
    for (let i = 0; i < count; i++) {
      const tex = Phaser.Utils.Array.GetRandom(symbols);
      const s = SCALE * 0.5;
      const sym = this.add.image(x, y, tex).setScale(s).setDepth(12);
      this.hudCam.ignore(sym);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 120;
      const duration = 400 + Math.random() * 800;
      this.tweens.add({
        targets: sym,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 20 - Math.random() * 30,
        scale: s * (0.3 + Math.random() * 0.7),
        alpha: 0,
        angle: Phaser.Math.Between(-270, 270),
        duration,
        delay: Math.random() * 150,
        ease: "Quad.easeOut",
        onComplete: () => sym.destroy(),
      });
    }

    // Explosion SFX — directional relative to drone
    this.playSfxAt("explosion", x, y, 0.7);

    // Screen shake
    this.cameras.main.shake(200, 0.005);

    // Check building hits
    for (const b of this.buildings) {
      if (b.destroyed) continue;
      const dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (dist < b.radius) {
        b.hp--;
        if (b.hp <= 0) {
          // Destroyed
          b.destroyed = true;
          if (b.isOilWell) {
            b.sprite.setTexture("oil-well-burn");
            b.sprite.clearTint();
            if (b.wellRef) b.wellRef.alive = false;
          } else if (b.isOilInfra) {
            // Oil tank — show as dark burned tank
            b.sprite.setTint(0x333333);
          } else {
            b.sprite.setTexture("rubble");
            b.sprite.setTint(0x888888);
          }
          if (b.cracksSprite) b.cracksSprite.destroy();
          for (const f of b.fireSprites) f.destroy();
          b.fireSprites = [];
          // Big explosion
          this.time.delayedCall(100, () => {
            const exp3 = this.add
              .sprite(b.x, b.y, "explosion-sheet", 0)
              .setScale(SCALE * 2)
              .setDepth(11);
            this.hudCam.ignore(exp3);
            exp3.play("explode");
            exp3.once("animationcomplete", () => exp3.destroy());
          });
          // Oil infrastructure burns forever with black smoke
          if (b.isOilInfra) {
            // Persistent fire
            const permFire = this.add.image(b.x, b.y - 5, "fire")
              .setScale(SCALE * 1.5).setDepth(3);
            this.hudCam.ignore(permFire);
            this.tweens.add({
              targets: permFire,
              scaleX: { from: SCALE * 1.2, to: SCALE * 1.8 },
              scaleY: { from: SCALE * 1.5, to: SCALE * 2.0 },
              alpha: { from: 1, to: 0.7 },
              duration: 400,
              yoyo: true,
              repeat: -1,
            });
            // Perpetual black smoke plume
            this.time.addEvent({
              delay: 300,
              loop: true,
              callback: () => {
                const smoke = this.add.image(
                  b.x + Phaser.Math.Between(-10, 10),
                  b.y - 10,
                  "smoke",
                ).setScale(SCALE * 0.6).setDepth(12).setAlpha(0.7).setTint(0x222222);
                this.hudCam.ignore(smoke);
                this.tweens.add({
                  targets: smoke,
                  y: b.y - 80 - Math.random() * 40,
                  x: smoke.x + Phaser.Math.Between(-20, 20),
                  scale: SCALE * (1.5 + Math.random()),
                  alpha: 0,
                  duration: 1500 + Math.random() * 500,
                  onComplete: () => smoke.destroy(),
                });
              },
            });
          }
          // Kill people hiding in this building
          this.killPeopleInBuilding(b);
        } else {
          // Show damage — darken tint based on remaining hp
          const dmgFrac = b.hp / b.maxHp;
          const tintVal = Math.floor(0x88 + 0x77 * dmgFrac);
          const tint = (tintVal << 16) | (tintVal << 8) | tintVal;
          b.sprite.setTint(tint);
          // Add cracks on first hit
          if (!b.cracksSprite) {
            b.cracksSprite = this.add
              .image(b.x, b.y, "cracks")
              .setScale(SCALE)
              .setDepth(3)
              .setAlpha(0.6);
            this.hudCam.ignore(b.cracksSprite);
          }
          // Add fire at half hp or below
          if (b.hp <= b.maxHp / 2) {
            const fire = this.add
              .image(
                b.x + Phaser.Math.Between(-15, 15),
                b.y + Phaser.Math.Between(-15, 15),
                "fire",
              )
              .setScale(SCALE)
              .setDepth(3);
            this.hudCam.ignore(fire);
            b.fireSprites.push(fire);
            // Animate fire flicker
            this.tweens.add({
              targets: fire,
              alpha: { from: 1, to: 0.5 },
              scaleX: { from: SCALE, to: SCALE * 0.8 },
              scaleY: { from: SCALE, to: SCALE * 1.2 },
              duration: 300,
              yoyo: true,
              repeat: -1,
            });
          }
          // Smoke puff on hit
          const smoke = this.add
            .image(b.x, b.y - 10, "smoke")
            .setScale(SCALE)
            .setDepth(12)
            .setAlpha(0.8);
          this.hudCam.ignore(smoke);
          this.tweens.add({
            targets: smoke,
            y: b.y - 60,
            alpha: 0,
            scale: SCALE * 2,
            duration: 800,
            ease: "Quad.easeOut",
            onComplete: () => smoke.destroy(),
          });
        }
      }
    }

    // Kill town cars — ghosts float out
    for (const car of this.townCars) {
      if (!car.alive) continue;
      const dist = Phaser.Math.Distance.Between(x, y, car.sprite.x, car.sprite.y);
      if (dist < 40) {
        car.alive = false;
        car.sprite.setTexture("car-dead");
        this.kills += car.passengers;
        // Explosion
        const carExp = this.add.sprite(car.sprite.x, car.sprite.y, "explosion-sheet", 0)
          .setScale(SCALE * 1.5).setDepth(11);
        this.hudCam.ignore(carExp);
        carExp.play("explode");
        carExp.once("animationcomplete", () => carExp.destroy());
        // Spawn ghosts for each passenger
        for (let gi = 0; gi < car.passengers; gi++) {
          const spawnAngle = (gi / car.passengers) * Math.PI * 2 + Math.random() * 0.5;
          this.time.delayedCall(gi * 250, () => {
            const ghost = this.add.image(
              car.sprite.x + Math.cos(spawnAngle) * 15,
              car.sprite.y + Math.sin(spawnAngle) * 15,
              "ghost",
            ).setScale(SCALE).setDepth(13).setAlpha(0.8);
            this.hudCam.ignore(ghost);
            const line = Phaser.Utils.Array.GetRandom(ghostLines);
            const bubble = this.add
              .text(ghost.x + 20, ghost.y - 20, line, {
                fontFamily: "monospace",
                fontSize: "8px",
                color: "#aaccff",
                backgroundColor: "#000000aa",
                padding: { x: 4, y: 3 },
              })
              .setScale(SCALE * 0.5).setDepth(14);
            this.hudCam.ignore(bubble);
            const driftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
            const driftY = -(20 + Math.random() * 20);
            const wobble = Math.random() * Math.PI * 2;
            // Animate ghost manually via tween
            this.tweens.add({
              targets: ghost,
              alpha: 0,
              y: ghost.y - 150,
              duration: 5000,
              onUpdate: () => {
                ghost.x += driftX * 0.016;
                ghost.x += Math.sin(ghost.y * 0.04 + wobble) * 0.3;
                bubble.setPosition(ghost.x + 20, ghost.y - 20);
                bubble.setAlpha(ghost.alpha);
              },
              onComplete: () => {
                ghost.destroy();
                bubble.destroy();
              },
            });
          });
        }
      }
    }

    // Kill dirt bikers — turn into ghosts
    for (const bk of this.dirtBikers) {
      if (!bk.alive) continue;
      const dist = Phaser.Math.Distance.Between(x, y, bk.sprite.x, bk.sprite.y);
      if (dist < 60) {
        bk.alive = false;
        this.kills++;
        // Explosion at biker position
        const bkExp = this.add.sprite(bk.sprite.x, bk.sprite.y, "explosion-sheet", 0)
          .setScale(SCALE * 1.5).setDepth(11);
        this.hudCam.ignore(bkExp);
        bkExp.play("explode");
        bkExp.once("animationcomplete", () => bkExp.destroy());
        // Ghost floats away
        bk.sprite.setTexture("ghost");
        bk.sprite.setAlpha(0.8);
        bk.sprite.setDepth(13);
        const awayAngle = Phaser.Math.Angle.Between(x, y, bk.sprite.x, bk.sprite.y);
        bk.ghostDriftX = Math.cos(awayAngle) * (15 + Math.random() * 25);
        bk.ghostDriftY = -(20 + Math.random() * 20);
        bk.ghostWobble = Math.random() * Math.PI * 2;
        bk.isGhost = true;
        // Speech bubble
        const line = Phaser.Utils.Array.GetRandom(ghostLines);
        bk.bubble = this.add
          .text(bk.sprite.x + 20, bk.sprite.y - 20, line, {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#aaccff",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(SCALE * 0.5)
          .setDepth(14);
        this.hudCam.ignore(bk.bubble);
      }
    }

    // Kill or panic nearby animals
    this.affectNearbyAnimals(x, y);

    // Kill or panic nearby people
    this.affectNearbyPeople(x, y);
  }

  affectNearbyPeople(x, y) {
    const killRadius = 50;
    const panicRadius = 400;

    for (const p of this.people) {
      if (p.state === "ghost" || p.state === "gone" || p.state === "hiding")
        continue;
      const dist = Phaser.Math.Distance.Between(x, y, p.sprite.x, p.sprite.y);

      if (dist < killRadius) {
        // Killed — become ghost
        p.state = "ghost";
        this.kills++;
        if (p.bubble) {
          p.bubble.destroy();
          p.bubble = null;
        }
        p.sprite.setTexture("ghost");
        p.sprite.setAlpha(0.8);
        p.sprite.setDepth(13);
        // Random drift away from explosion
        const awayAngle = Phaser.Math.Angle.Between(
          x,
          y,
          p.sprite.x,
          p.sprite.y,
        );
        p.ghostDriftX = Math.cos(awayAngle) * (15 + Math.random() * 25);
        p.ghostDriftY = -(20 + Math.random() * 20);
        p.ghostWobbleOffset = Math.random() * Math.PI * 2;

        // Ghost speech bubble
        const line = Phaser.Utils.Array.GetRandom(ghostLines);
        p.bubble = this.add
          .text(p.sprite.x + 20, p.sprite.y - 20, line, {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#aaccff",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(SCALE * 0.5)
          .setDepth(14);
        this.hudCam.ignore(p.bubble);
      } else if (
        dist < panicRadius &&
        p.state !== "panicking" &&
        p.state !== "hiding"
      ) {
        // Panic
        p.state = "panicking";
        if (p.bubble) {
          p.bubble.destroy();
          p.bubble = null;
        }
        if (p.scatterPanic) {
          // Scatter in a random direction (away-ish from explosion)
          const awayAngle = Phaser.Math.Angle.Between(
            x,
            y,
            p.sprite.x,
            p.sprite.y,
          );
          p.runAngle = awayAngle + (Math.random() - 0.5) * Math.PI;
          p.hideTarget = null;
        } else {
          // Find nearest building to hide in
          p.hideTarget = this.findNearestBuilding(p.sprite.x, p.sprite.y);
          if (p.hideTarget) {
            p.runAngle = Phaser.Math.Angle.Between(
              p.sprite.x,
              p.sprite.y,
              p.hideTarget.x,
              p.hideTarget.y,
            );
          } else {
            p.runAngle = Phaser.Math.Angle.Between(
              x,
              y,
              p.sprite.x,
              p.sprite.y,
            );
          }
        }
      }
    }
  }

  findNearestBuilding(px, py) {
    let best = null;
    let bestDist = Infinity;
    for (const b of this.buildings) {
      if (b.destroyed) continue;
      const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }

  killPeopleInBuilding(building) {
    // buildingGhostLines imported from dialog.js
    let ghostIdx = 0;
    for (const p of this.people) {
      if (p.state !== "hiding") continue;
      if (p.hideTarget !== building) continue;
      const idx = ghostIdx++;
      // Stagger each ghost's appearance
      this.time.delayedCall(idx * 300, () => {
        p.state = "ghost";
        this.kills++;
        // Spread starting positions around the building
        const spawnAngle =
          (idx / Math.max(ghostIdx, 1)) * Math.PI * 2 + Math.random() * 0.5;
        p.sprite.setPosition(
          building.x + Math.cos(spawnAngle) * 25,
          building.y + Math.sin(spawnAngle) * 25,
        );
        p.sprite.setVisible(true);
        p.sprite.setTexture("ghost");
        p.sprite.setAlpha(0.8);
        p.sprite.setDepth(13);
        // Each ghost drifts in a unique direction
        p.ghostDriftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
        p.ghostDriftY = -(20 + Math.random() * 20); // always float up, but at different speeds
        p.ghostWobbleOffset = Math.random() * Math.PI * 2;

        const line = Phaser.Utils.Array.GetRandom(buildingGhostLines);
        p.bubble = this.add
          .text(p.sprite.x + 20, p.sprite.y - 20, line, {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#aaccff",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(SCALE * 0.5)
          .setDepth(14);
        this.hudCam.ignore(p.bubble);
      });
    }
  }

  isInsideBuilding(px, py) {
    for (const b of this.buildings) {
      if (b.destroyed) continue;
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < b.radius) {
        return true;
      }
    }
    return false;
  }

  steerAroundBuildings(px, py, angle, dt) {
    // Check if next position would be inside a building
    const checkDist = 40;
    const nx = px + Math.cos(angle) * checkDist;
    const ny = py + Math.sin(angle) * checkDist;
    for (const b of this.buildings) {
      if (b.destroyed) continue;
      const d = Phaser.Math.Distance.Between(nx, ny, b.x, b.y);
      if (d < b.radius + 20) {
        // Steer perpendicular to the building
        const awayAngle = Phaser.Math.Angle.Between(b.x, b.y, px, py);
        return awayAngle;
      }
    }
    return angle;
  }

  updatePeople(dt, delta) {
    const ds = this.droneState;
    const droneDetectRadius = 600;
    const wanderSpeed = 30;
    const panicSpeed = 60;

    for (const p of this.people) {
      if (p.state === "gone" || p.state === "hiding") continue;
      // Soccer players/spectators in idle state are controlled by updateSoccer
      if ((p.isSoccerPlayer || p.isSoccerSpectator) && p.state === "idle")
        continue;

      const distToDrone = Phaser.Math.Distance.Between(
        ds.x,
        ds.y,
        p.sprite.x,
        p.sprite.y,
      );

      // --- IDLE: wander slowly ---
      if (p.state === "idle") {
        // Detect drone
        if (!p.noGreet && ds.altitude > 0 && distToDrone < droneDetectRadius) {
          p.state = "waving";
          p.waveTimer = 0;
          // Only show bubble if no other bubble is within 150px
          let tooClose = false;
          for (const other of this.people) {
            if (other === p || !other.bubble || other.state !== "waving") continue;
            if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, other.sprite.x, other.sprite.y) < 150) {
              tooClose = true;
              break;
            }
          }
          if (!tooClose) {
            p.bubble = this.add
              .text(p.sprite.x + 20, p.sprite.y - 30, p.greeting, {
                fontFamily: "monospace",
                fontSize: "8px",
                color: "#000",
                backgroundColor: "#fff",
                padding: { x: 4, y: 3 },
              })
              .setScale(SCALE * 0.5)
              .setDepth(13);
            this.hudCam.ignore(p.bubble);
          }
        } else {
          // Wander
          p.wanderTimer = (p.wanderTimer || 0) + dt;
          if (p.wanderTimer > p.wanderDuration) {
            // Pick new direction or stop
            p.wanderTimer = 0;
            p.wanderDuration = 2 + Math.random() * 4;
            if (Math.random() < 0.4) {
              p.wanderAngle = null; // stop and stand
            } else {
              p.wanderAngle = Math.random() * Math.PI * 2;
            }
          }
          if (p.wanderAngle !== null && p.wanderAngle !== undefined) {
            const steered = this.steerAroundBuildings(
              p.sprite.x,
              p.sprite.y,
              p.wanderAngle,
              dt,
            );
            p.sprite.x += Math.cos(steered) * wanderSpeed * dt;
            p.sprite.y += Math.sin(steered) * wanderSpeed * dt;
            p.sprite.setFlipX(Math.cos(steered) < 0);
            // Walk anim
            p.runTimer = (p.runTimer || 0) + delta;
            if (p.runTimer > 200) {
              p.runTimer = 0;
              p.runFrame = 1 - p.runFrame;
              p.sprite.setTexture(
                p.runFrame === 0
                  ? `person-run1-${p.skinId}`
                  : `person-run2-${p.skinId}`,
              );
            }
          } else {
            p.sprite.setTexture(this.skinTex(p, "stand"));
          }
          // Clamp to world
          p.sprite.x = Phaser.Math.Clamp(p.sprite.x, 50, WORLD_W * SCALE - 50);
          p.sprite.y = Phaser.Math.Clamp(p.sprite.y, 50, WORLD_H * SCALE - 50);
        }
      }

      // --- WAVING ---
      if (p.state === "waving") {
        p.waveTimer += delta;
        if (p.waveTimer > 250) {
          p.waveTimer = 0;
          p.waveFrame = 1 - p.waveFrame;
          p.sprite.setTexture(this.skinTex(p, p.waveFrame === 0 ? "wave1" : "wave2"));
        }
        if (distToDrone > droneDetectRadius * 1.5 || ds.altitude <= 0) {
          p.state = "idle";
          p.sprite.setTexture(this.skinTex(p, "stand"));
          if (p.bubble) {
            p.bubble.destroy();
            p.bubble = null;
          }
        }
      }

      // --- PANICKING: run toward nearest building ---
      if (p.state === "panicking") {
        p.runTimer = (p.runTimer || 0) + delta;
        if (p.runTimer > 120) {
          p.runTimer = 0;
          p.runFrame = 1 - p.runFrame;
          p.sprite.setTexture(this.skinTex(p, p.runFrame === 0 ? "run1" : "run2"));
        }

        // Update angle toward hide target if it exists
        if (p.hideTarget && !p.hideTarget.destroyed) {
          p.runAngle = Phaser.Math.Angle.Between(
            p.sprite.x,
            p.sprite.y,
            p.hideTarget.x,
            p.hideTarget.y,
          );
          // Check if reached the building
          const distToB = Phaser.Math.Distance.Between(
            p.sprite.x,
            p.sprite.y,
            p.hideTarget.x,
            p.hideTarget.y,
          );
          if (distToB < 20) {
            // Hide inside
            p.state = "hiding";
            p.sprite.setVisible(false);
            continue;
          }
        } else if (p.hideTarget && p.hideTarget.destroyed) {
          // Target destroyed — find another
          p.hideTarget = this.findNearestBuilding(p.sprite.x, p.sprite.y);
          if (!p.hideTarget) {
            // No buildings left — just run away
            p.runAngle += (Math.random() - 0.5) * 0.5;
          }
        }

        p.sprite.x += Math.cos(p.runAngle) * panicSpeed * dt;
        p.sprite.y += Math.sin(p.runAngle) * panicSpeed * dt;
        p.sprite.setFlipX(Math.cos(p.runAngle) < 0);

        // Bounce off world boundaries
        const margin = 100;
        const worldW = WORLD_W * SCALE;
        const worldH = WORLD_H * SCALE;
        if (p.sprite.x < margin) {
          p.sprite.x = margin;
          p.runAngle = Math.PI - p.runAngle;
        }
        if (p.sprite.x > worldW - margin) {
          p.sprite.x = worldW - margin;
          p.runAngle = Math.PI - p.runAngle;
        }
        if (p.sprite.y < margin) {
          p.sprite.y = margin;
          p.runAngle = -p.runAngle;
        }
        if (p.sprite.y > worldH - margin) {
          p.sprite.y = worldH - margin;
          p.runAngle = -p.runAngle;
        }

        // Calm down if drone is far away for a while
        p.panicTimer = (p.panicTimer || 0) + dt;
        if (distToDrone > 800 && p.panicTimer > 5) {
          p.state = "idle";
          p.panicTimer = 0;
          p.hideTarget = null;
          p.noGreet = false; // allow greeting after surviving a scare
          if (!p.greeting) {
            p.greeting = Phaser.Utils.Array.GetRandom(greetings);
          }
          p.sprite.setTexture(this.skinTex(p, "stand"));
        }
        // Reset calm-down timer if drone is nearby
        if (distToDrone <= 800) {
          p.panicTimer = 0;
        }
      }

      // --- GHOST ---
      if (p.state === "ghost") {
        const driftX = p.ghostDriftX || 0;
        const driftY = p.ghostDriftY || -30;
        const wobbleOff = p.ghostWobbleOffset || 0;
        p.sprite.y += driftY * dt;
        p.sprite.x +=
          driftX * dt + Math.sin(p.sprite.y * 0.04 + wobbleOff) * 15 * dt;
        p.sprite.setAlpha(p.sprite.alpha - 0.08 * dt);

        if (p.bubble) {
          p.bubble.setPosition(p.sprite.x + 20, p.sprite.y - 20);
          p.bubble.setAlpha(p.sprite.alpha);
        }

        if (p.sprite.alpha <= 0) {
          p.sprite.destroy();
          if (p.bubble) {
            p.bubble.destroy();
            p.bubble = null;
          }
          if (p.carriedGoods) {
            p.carriedGoods.destroy();
            p.carriedGoods = null;
          }
          p.state = "gone";
        }
      }

      // --- Update carried goods position ---
      if (p.carriedGoods && p.carriedGoods.active) {
        if (p.state === "gone" || p.state === "hiding") {
          p.carriedGoods.setVisible(false);
        } else if (p.state === "ghost") {
          p.carriedGoods.setVisible(false);
        } else {
          p.carriedGoods.setVisible(true);
          p.carriedGoods.setPosition(p.sprite.x + 8, p.sprite.y - 5);
        }
      }
    }
  }

  updateSoccer(dt, delta) {
    if (!this.soccerActive) return;

    const fc = this.soccerFieldCenter;
    const ball = this.soccerBall;
    const players = this.soccerPlayers;
    const hw = this.soccerFieldW / 2;
    const hh = this.soccerFieldH / 2;

    if (!ball.active) return;

    // --- Determine closest active (idle) player per team to ball ---
    let chaserA = null,
      chaserB = null;
    let bestDistA = Infinity,
      bestDistB = Infinity;
    for (const p of players) {
      if (!p.sprite.active || p.personEntry.state !== "idle") continue;
      const d = Phaser.Math.Distance.Between(
        p.sprite.x,
        p.sprite.y,
        ball.x,
        ball.y,
      );
      if (p.team === "team-a" && d < bestDistA) {
        bestDistA = d;
        chaserA = p;
      }
      if (p.team === "team-b" && d < bestDistB) {
        bestDistB = d;
        chaserB = p;
      }
    }

    // --- Ball holder & passing ---
    this.soccerPassTimer += dt;

    // Check if a chaser reached the ball
    if (chaserA && bestDistA < 15 && this.soccerBallHolder !== chaserA) {
      this.soccerBallHolder = chaserA;
      this.soccerPassTimer = 0;
    }
    if (chaserB && bestDistB < 15 && this.soccerBallHolder !== chaserB) {
      this.soccerBallHolder = chaserB;
      this.soccerPassTimer = 0;
    }

    // Ball follows holder
    if (this.soccerBallHolder && this.soccerBallHolder.sprite.active) {
      const h = this.soccerBallHolder;
      ball.x = h.sprite.x + 8;
      ball.y = h.sprite.y + 5;

      // After holding for a bit, kick toward a teammate or the goal
      if (this.soccerPassTimer > 1.0 + Math.random() * 0.5) {
        this.soccerPassTimer = 0;
        // Find a teammate to pass to, or shoot at goal
        const teammates = players.filter(
          (p) => p.team === h.team && p !== h && p.sprite.active,
        );
        const shootChance = 0.3;
        if (Math.random() < shootChance || teammates.length === 0) {
          // Shoot at goal
          const goalX = h.team === "team-a" ? fc.x + hw + 10 : fc.x - hw - 10;
          this.soccerBallVel = {
            x: (goalX - ball.x) * 0.8,
            y: (fc.y + Phaser.Math.Between(-30, 30) - ball.y) * 0.8,
          };
        } else {
          const target = Phaser.Utils.Array.GetRandom(teammates);
          this.soccerBallVel = {
            x: (target.sprite.x - ball.x) * 0.6,
            y: (target.sprite.y - ball.y) * 0.6,
          };
        }
        this.soccerBallHolder = null;
      }
    } else {
      // Ball is free — move with velocity and slow down
      if (this.soccerBallVel) {
        ball.x += this.soccerBallVel.x * dt;
        ball.y += this.soccerBallVel.y * dt;
        this.soccerBallVel.x *= 0.97;
        this.soccerBallVel.y *= 0.97;
        if (
          Math.abs(this.soccerBallVel.x) < 1 &&
          Math.abs(this.soccerBallVel.y) < 1
        ) {
          this.soccerBallVel = null;
        }
      }
      // Keep ball on field
      ball.x = Phaser.Math.Clamp(ball.x, fc.x - hw, fc.x + hw);
      ball.y = Phaser.Math.Clamp(ball.y, fc.y - hh, fc.y + hh);

      // If ball went past a goal line, reset to center
      if (ball.x <= fc.x - hw + 5 || ball.x >= fc.x + hw - 5) {
        ball.x = fc.x;
        ball.y = fc.y;
        this.soccerBallVel = null;
        this.soccerBallHolder = null;
      }
    }

    // --- Move players (only those still playing) ---
    for (const p of players) {
      if (!p.sprite.active) continue;
      // Skip players that are panicking, ghost, gone, etc.
      if (p.personEntry.state !== "idle") {
        // Drop the ball if holder panicked/died
        if (this.soccerBallHolder === p) {
          this.soccerBallHolder = null;
        }
        continue;
      }

      const isChaser = p === chaserA || p === chaserB;
      const isHolder = p === this.soccerBallHolder;
      const teamSide = p.team === "team-a" ? -1 : 1;
      let tx, ty, spd;

      if (isHolder) {
        tx = fc.x + teamSide * hw;
        ty = fc.y + Phaser.Math.Between(-30, 30);
        spd = 55;
      } else if (isChaser && !this.soccerBallHolder) {
        tx = ball.x;
        ty = ball.y;
        spd = 70;
      } else if (
        isChaser &&
        this.soccerBallHolder &&
        this.soccerBallHolder.team !== p.team
      ) {
        tx = this.soccerBallHolder.sprite.x;
        ty = this.soccerBallHolder.sprite.y;
        spd = 65;
      } else {
        if (!p.formX || Math.random() < 0.005) {
          const posIdx = players.filter((pp) => pp.team === p.team).indexOf(p);
          const spread = hh * 0.7;
          const ySlots = [-spread, -spread / 2, 0, spread / 2, spread];
          const yPos = ySlots[posIdx % 5] || 0;
          p.formX = fc.x + teamSide * Phaser.Math.Between(20, hw - 30);
          p.formY = fc.y + yPos + Phaser.Math.Between(-15, 15);
        }
        tx = p.formX;
        ty = p.formY;
        spd = 40;
      }

      const angle = Phaser.Math.Angle.Between(p.sprite.x, p.sprite.y, tx, ty);
      const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, tx, ty);

      if (dist > 8) {
        p.sprite.x += Math.cos(angle) * spd * dt;
        p.sprite.y += Math.sin(angle) * spd * dt;
        p.sprite.setFlipX(Math.cos(angle) < 0);
        p.runTimer += delta;
        if (p.runTimer > 150) {
          p.runTimer = 0;
          p.runFrame = 1 - p.runFrame;
          p.sprite.setTexture(
            p.runFrame === 0 ? `${p.team}-run1` : `${p.team}-run2`,
          );
        }
      } else {
        p.sprite.setTexture(`${p.team}-stand`);
      }

      // Keep on field (only while playing)
      p.sprite.x = Phaser.Math.Clamp(
        p.sprite.x,
        fc.x - hw + 10,
        fc.x + hw - 10,
      );
      p.sprite.y = Phaser.Math.Clamp(
        p.sprite.y,
        fc.y - hh + 10,
        fc.y + hh - 10,
      );
    }

    // --- Spectator clapping (only while idle) ---
    for (const spec of this.soccerSpectators) {
      if (!spec.sprite.active) continue;
      if (spec.personEntry && spec.personEntry.state !== "idle") continue;
      spec.clapTimer += delta;
      if (spec.clapTimer > spec.clapInterval) {
        spec.clapTimer = 0;
        spec.clapFrame = 1 - spec.clapFrame;
        spec.sprite.setTexture(
          spec.clapFrame === 0
            ? `person-wave1-${spec.skinId}`
            : `person-wave2-${spec.skinId}`,
        );
      }
    }
  }

  affectNearbyAnimals(x, y) {
    const killRadius = 50;
    const panicRadius = 300;

    for (const a of this.animals) {
      if (a.state === "dead") continue;
      const dist = Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y);

      if (dist < killRadius) {
        // Explode into meat!
        a.state = "dead";
        a.sprite.setVisible(false);
        const meatCount = Phaser.Math.Between(3, 6);
        for (let m = 0; m < meatCount; m++) {
          const meat = this.add.image(a.sprite.x, a.sprite.y, "meat")
            .setScale(SCALE * 0.7).setDepth(12);
          this.hudCam.ignore(meat);
          const angle = Math.random() * Math.PI * 2;
          const flingDist = 30 + Math.random() * 60;
          this.tweens.add({
            targets: meat,
            x: a.sprite.x + Math.cos(angle) * flingDist,
            y: a.sprite.y + Math.sin(angle) * flingDist,
            angle: Phaser.Math.Between(-360, 360),
            alpha: 0,
            duration: 800 + Math.random() * 400,
            delay: Math.random() * 100,
            ease: "Quad.easeOut",
            onComplete: () => meat.destroy(),
          });
        }
      } else if (dist < panicRadius && a.state !== "panicking") {
        a.state = "panicking";
        const awayAngle = Phaser.Math.Angle.Between(x, y, a.sprite.x, a.sprite.y);
        a.runAngle = awayAngle + (Math.random() - 0.5) * 1.0;
        a.panicTimer = 0;
      }
    }
  }

  updateAnimals(dt) {
    const worldW = WORLD_W * SCALE;
    const worldH = WORLD_H * SCALE;

    for (const a of this.animals) {
      if (a.state === "dead") continue;

      // Determine if animal is inside its corral
      const insideCorral = Math.abs(a.sprite.x - a.corral.x) < a.corral.hw &&
                           Math.abs(a.sprite.y - a.corral.y) < a.corral.hh;

      if (a.state === "idle") {
        // Wander
        a.wanderTimer += dt;
        if (a.wanderTimer > a.wanderDuration) {
          a.wanderTimer = 0;
          a.wanderDuration = 1 + Math.random() * 3;
          a.moving = Math.random() > 0.3;
          a.wanderAngle = Math.random() * Math.PI * 2;
        }

        if (a.moving) {
          const speed = a.type === "chicken" ? 15 : 10;
          // Steer around buildings
          const steered = this.steerAroundBuildings(
            a.sprite.x, a.sprite.y, a.wanderAngle, dt,
          );
          if (steered !== a.wanderAngle) a.wanderAngle = steered;

          const nx = a.sprite.x + Math.cos(a.wanderAngle) * speed * dt;
          const ny = a.sprite.y + Math.sin(a.wanderAngle) * speed * dt;

          if (insideCorral) {
            if (Math.abs(nx - a.corral.x) < a.corral.hw - 10 &&
                Math.abs(ny - a.corral.y) < a.corral.hh - 10) {
              a.sprite.x = nx;
              a.sprite.y = ny;
            } else {
              a.wanderAngle = Phaser.Math.Angle.Between(
                a.sprite.x, a.sprite.y, a.corral.x, a.corral.y,
              ) + (Math.random() - 0.5) * 1.0;
            }
          } else {
            const wanderRadius = 60;
            if (!a.freeRoamOrigin) {
              a.freeRoamOrigin = { x: a.sprite.x, y: a.sprite.y };
            }
            if (Math.abs(nx - a.freeRoamOrigin.x) < wanderRadius &&
                Math.abs(ny - a.freeRoamOrigin.y) < wanderRadius &&
                nx > 10 && nx < worldW - 10 &&
                ny > 10 && ny < worldH - 10) {
              a.sprite.x = nx;
              a.sprite.y = ny;
            } else {
              a.wanderAngle = Phaser.Math.Angle.Between(
                a.sprite.x, a.sprite.y, a.freeRoamOrigin.x, a.freeRoamOrigin.y,
              ) + (Math.random() - 0.5) * 1.0;
            }
          }
          a.sprite.setFlipX(Math.cos(a.wanderAngle) < 0);

          // Run animation frame cycling
          a.runTimer += dt;
          if (a.runTimer > 0.15) {
            a.runTimer = 0;
            a.runFrame = 1 - a.runFrame;
            a.sprite.setTexture(a.runFrame === 0 ? a.type : a.type + '2');
          }
        } else {
          // Standing still: reset to base frame
          a.sprite.setTexture(a.type);
          a.runTimer = 0;
          a.runFrame = 0;
        }
      }

      if (a.state === "panicking") {
        const speed = a.type === "chicken" ? 80 : a.type === "camel" ? 50 : 60;
        // Steer around buildings
        a.runAngle = this.steerAroundBuildings(
          a.sprite.x, a.sprite.y, a.runAngle, dt,
        );
        a.sprite.x += Math.cos(a.runAngle) * speed * dt;
        a.sprite.y += Math.sin(a.runAngle) * speed * dt;
        a.sprite.setFlipX(Math.cos(a.runAngle) < 0);

        // Run animation frame cycling
        a.runTimer += dt;
        if (a.runTimer > 0.15) {
          a.runTimer = 0;
          a.runFrame = 1 - a.runFrame;
          a.sprite.setTexture(a.runFrame === 0 ? a.type : a.type + '2');
        }

        // Bounce off world edges
        const margin = 50;
        if (a.sprite.x < margin) { a.sprite.x = margin; a.runAngle = Math.PI - a.runAngle; }
        if (a.sprite.x > worldW - margin) { a.sprite.x = worldW - margin; a.runAngle = Math.PI - a.runAngle; }
        if (a.sprite.y < margin) { a.sprite.y = margin; a.runAngle = -a.runAngle; }
        if (a.sprite.y > worldH - margin) { a.sprite.y = worldH - margin; a.runAngle = -a.runAngle; }

        // Calm down after a while
        a.panicTimer += dt;
        if (a.panicTimer > 8) {
          a.state = "idle";
          a.panicTimer = 0;
          a.freeRoamOrigin = null; // Reset so it picks up current position if outside corral
        }
      }
    }
  }

  updateOilWells(delta) {
    for (const well of this.oilWells) {
      if (!well.alive) continue;
      well.pumpTimer += delta;
      if (well.pumpTimer > well.pumpSpeed) {
        well.pumpTimer = 0;
        well.pumpFrame = 1 - well.pumpFrame;
        well.sprite.setTexture(well.pumpFrame === 0 ? "oil-well1" : "oil-well2");
      }
    }
  }

  updateDirtBikers(dt, delta) {
    const worldW = WORLD_W * SCALE;
    const worldH = WORLD_H * SCALE;
    const margin = 200;

    for (const bk of this.dirtBikers) {
      // Ghost float animation
      if (bk.isGhost) {
        if (!bk.sprite.active) continue;
        bk.sprite.y += (bk.ghostDriftY || -30) * dt;
        bk.sprite.x += (bk.ghostDriftX || 0) * dt + Math.sin(bk.sprite.y * 0.04 + (bk.ghostWobble || 0)) * 15 * dt;
        bk.sprite.setAlpha(bk.sprite.alpha - 0.08 * dt);
        if (bk.bubble) {
          bk.bubble.setPosition(bk.sprite.x + 20, bk.sprite.y - 20);
          bk.bubble.setAlpha(bk.sprite.alpha);
        }
        if (bk.sprite.alpha <= 0) {
          bk.sprite.destroy();
          if (bk.bubble) { bk.bubble.destroy(); bk.bubble = null; }
        }
        continue;
      }
      if (!bk.alive) continue;

      // Pick new random destination periodically
      bk.retargetTimer += dt;
      if (bk.retargetTimer > 3 + Math.random() * 4) {
        bk.retargetTimer = 0;
        bk.targetX = Phaser.Math.Between(margin, worldW - margin);
        bk.targetY = Phaser.Math.Between(margin, worldH - margin);
      }

      // Steer toward target, avoiding buildings
      const targetAngle = Phaser.Math.Angle.Between(
        bk.sprite.x, bk.sprite.y, bk.targetX, bk.targetY,
      );

      // Smooth turn toward target
      let diff = Phaser.Math.Angle.Wrap(targetAngle - bk.heading);
      const maxTurn = 2.0 * dt;
      bk.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);

      // Steer around buildings
      bk.heading = this.steerAroundBuildings(
        bk.sprite.x, bk.sprite.y, bk.heading, dt,
      );

      // Move
      bk.sprite.x += Math.cos(bk.heading) * bk.speed * dt;
      bk.sprite.y += Math.sin(bk.heading) * bk.speed * dt;

      // Face direction of travel
      bk.sprite.setFlipX(Math.cos(bk.heading) < 0);

      // Bounce animation (riding over terrain)
      bk.bounceTimer += delta;
      if (bk.bounceTimer > 120) {
        bk.bounceTimer = 0;
        bk.bounceFrame = 1 - bk.bounceFrame;
        bk.sprite.setTexture(bk.bounceFrame === 0 ? "dirtbike" : "dirtbike2");
      }

      // Dust trail
      bk.dustTimer += delta;
      if (bk.dustTimer > 80) {
        bk.dustTimer = 0;
        const dust = this.add.image(
          bk.sprite.x - Math.cos(bk.heading) * 15,
          bk.sprite.y - Math.sin(bk.heading) * 15,
          "smoke",
        ).setScale(SCALE * 0.3).setDepth(1).setAlpha(0.4).setTint(0xccaa88);
        this.hudCam.ignore(dust);
        this.tweens.add({
          targets: dust,
          alpha: 0,
          scale: SCALE * 0.8,
          duration: 400,
          onComplete: () => dust.destroy(),
        });
      }

      // Keep on map
      bk.sprite.x = Phaser.Math.Clamp(bk.sprite.x, margin, worldW - margin);
      bk.sprite.y = Phaser.Math.Clamp(bk.sprite.y, margin, worldH - margin);
      if (bk.sprite.x <= margin || bk.sprite.x >= worldW - margin ||
          bk.sprite.y <= margin || bk.sprite.y >= worldH - margin) {
        // Redirect toward center
        bk.targetX = worldW / 2 + Phaser.Math.Between(-1000, 1000);
        bk.targetY = worldH / 2 + Phaser.Math.Between(-1000, 1000);
        bk.retargetTimer = 0;
      }
    }
  }

  getAdjacentRoadNodes(node) {
    // Find road intersection nodes adjacent to the given node (up/down/left/right)
    const step = this.townRoadSpacing * this.townRoadTile;
    const neighbors = [];
    for (const n of this.townRoadNodes) {
      const dx = Math.abs(n.x - node.x);
      const dy = Math.abs(n.y - node.y);
      // Adjacent = exactly one step away on one axis, same on the other
      if ((dx < 5 && Math.abs(dy - step) < 5) ||
          (dy < 5 && Math.abs(dx - step) < 5)) {
        neighbors.push(n);
      }
    }
    return neighbors;
  }

  updateTownCars(dt) {
    for (const car of this.townCars) {
      if (!car.alive) continue;

      // Pick next intersection to drive to
      if (!car.targetNode) {
        const neighbors = this.getAdjacentRoadNodes(car.currentNode);
        if (neighbors.length === 0) continue;
        // Avoid nodes with other cars nearby
        const best = neighbors.filter((n) => {
          for (const other of this.townCars) {
            if (other === car || !other.alive) continue;
            if (Phaser.Math.Distance.Between(n.x, n.y, other.sprite.x, other.sprite.y) < 30) {
              return false;
            }
          }
          return true;
        });
        car.targetNode = best.length > 0
          ? Phaser.Utils.Array.GetRandom(best)
          : Phaser.Utils.Array.GetRandom(neighbors);
      }

      // Drive toward target node
      const tx = car.targetNode.x;
      const ty = car.targetNode.y;
      const angle = Phaser.Math.Angle.Between(car.sprite.x, car.sprite.y, tx, ty);
      const dist = Phaser.Math.Distance.Between(car.sprite.x, car.sprite.y, tx, ty);

      // Slow down or stop for cars and people ahead
      let speed = car.speed;
      let blocked = false;
      // Check other cars
      for (const other of this.townCars) {
        if (other === car || !other.alive) continue;
        const d = Phaser.Math.Distance.Between(car.sprite.x, car.sprite.y, other.sprite.x, other.sprite.y);
        if (d < 60) {
          const aToOther = Phaser.Math.Angle.Between(car.sprite.x, car.sprite.y, other.sprite.x, other.sprite.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(aToOther - angle));
          if (angleDiff < 1.0) {
            speed = Math.min(speed, Math.max(0, (d - 30) * 0.8));
            if (d < 35) blocked = true;
          }
        }
      }
      // Check people on the road
      for (const p of this.people) {
        if (p.state === "gone" || p.state === "hiding" || p.state === "ghost") continue;
        const d = Phaser.Math.Distance.Between(car.sprite.x, car.sprite.y, p.sprite.x, p.sprite.y);
        if (d < 50) {
          const aToPerson = Phaser.Math.Angle.Between(car.sprite.x, car.sprite.y, p.sprite.x, p.sprite.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(aToPerson - angle));
          if (angleDiff < 0.8) {
            speed = Math.min(speed, Math.max(0, (d - 25) * 0.6));
            if (d < 30) blocked = true;
          }
        }
      }
      // If blocked, pick a new target direction
      if (blocked && !car._blockTimer) {
        car._blockTimer = 0;
      }
      if (blocked) {
        car._blockTimer += dt;
        if (car._blockTimer > 1.5) {
          car.targetNode = null; // will pick a new direction next frame
          car._blockTimer = 0;
        }
      } else {
        car._blockTimer = 0;
      }

      if (dist > 5) {
        car.sprite.x += Math.cos(angle) * speed * dt;
        car.sprite.y += Math.sin(angle) * speed * dt;
        // Rotate car to face direction (top-down, 0 = facing up)
        car.heading = angle;
        car.sprite.setRotation(angle + Math.PI / 2);
      } else {
        // Arrived at node
        car.currentNode = { x: car.targetNode.x, y: car.targetNode.y };
        car.targetNode = null;
      }
    }
  }
}
