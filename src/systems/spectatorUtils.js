import { SCALE } from "../constants.js";

/**
 * Create a ring of spectators around a center point.
 * ~50% hold money, ~50% are cheerers. All have returnHome logic.
 *
 * @param {object} scene - Phaser scene
 * @param {object} rng - Phaser RNG
 * @param {number} cx - center X in px
 * @param {number} cy - center Y in px
 * @param {object} opts
 * @param {number} opts.count - total spectators
 * @param {Array} opts.rings - array of { dist, fraction } for ring layout
 * @param {string[]} opts.greetings - dialog lines
 * @param {string} opts.event - returnHome event name
 * @param {string} opts.spectatorKey - key to store spectator anim data on scene (e.g. "chickenFightSpectators")
 * @param {string} opts.flagKey - key for the isXSpectator flag on person entry (e.g. "isChickenFightSpectator")
 */
export function createBettingSpectators(scene, rng, cx, cy, opts) {
  const {
    count, rings, greetings, event, spectatorKey, flagKey,
  } = opts;

  if (!scene[spectatorKey]) scene[spectatorKey] = [];

  for (const ring of rings) {
    const ringCount = Math.round(count * ring.fraction);
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2 + (ring.dist > 100 ? 0.1 : 0);
      const jitter = rng.between(-10, 10);
      const sx = cx + Math.cos(angle) * (ring.dist + jitter);
      const sy = cy + Math.sin(angle) * (ring.dist + jitter);
      const skinId = rng.between(0, 199);

      const holdsMoney = Math.random() > 0.5;
      const startTex = holdsMoney
        ? `person-stand-${skinId}`
        : `person-wave1-${skinId}`;
      const sprite = scene.add.image(sx, sy, startTex)
        .setScale(SCALE).setDepth(2);

      let moneySprite = null;
      if (holdsMoney) {
        moneySprite = scene.add.image(sx + 8, sy - 5, "money")
          .setScale(SCALE * 0.8).setDepth(3);
      }

      const personEntry = {
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(greetings),
        noGreet: true,
        scatterPanic: true,
        returnHome: { x: sx, y: sy, event },
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
        carriedGoods: moneySprite,
        [flagKey]: true,
        managedBySetPiece: true,
      };
      scene.people.push(personEntry);

      scene[spectatorKey].push({
        personEntry,
        sprite,
        skinId,
        holdsMoney,
        moneySprite,
        animTimer: rng.between(0, 500),
        animInterval: 300 + rng.between(0, 200),
        animFrame: 0,
      });
    }
  }
}

/**
 * Update spectator animations (wave money / cheer).
 * Call from the set piece's update function.
 */
export function updateBettingSpectators(scene, dt, spectatorKey) {
  const specs = scene[spectatorKey];
  if (!specs) return;

  for (const spec of specs) {
    if (!spec.sprite.active) continue;
    if (spec.personEntry.state !== "idle") continue;

    spec.animTimer += dt * 1000;
    if (spec.animTimer > spec.animInterval) {
      spec.animTimer = 0;
      spec.animFrame = 1 - spec.animFrame;

      if (spec.holdsMoney) {
        spec.sprite.setTexture(
          spec.animFrame === 0
            ? `person-wave1-${spec.skinId}`
            : `person-wave2-${spec.skinId}`,
        );
        if (spec.moneySprite) {
          const yOff = spec.animFrame === 0 ? -8 : -14;
          spec.moneySprite.setPosition(spec.sprite.x + 10, spec.sprite.y + yOff);
        }
      } else {
        spec.sprite.setTexture(
          spec.animFrame === 0
            ? `person-wave1-${spec.skinId}`
            : `person-wave2-${spec.skinId}`,
        );
      }
    }
  }
}
