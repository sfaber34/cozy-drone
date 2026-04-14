// Shared utility for set-pieces that spawn "managed" people — i.e. people
// whose movement is driven by the set-piece itself rather than the default
// people-wandering AI, but who still participate in panic/returnHome when
// the drone gets close. Keeps the boilerplate in one place.
import { SCALE } from "../constants.js";

/**
 * Create a person sprite + entry configured as `managedBySetPiece`, push it
 * to scene.people, and return `{ sprite, personEntry }` for the caller to
 * attach its own state to.
 *
 * @param {Phaser.Scene} scene
 * @param {{x: number, y: number, skinId: number, texture?: string,
 *          greeting?: string, depth?: number, event?: string,
 *          flip?: boolean, flagKey?: string, carriedGoods?: any}} opts
 */
export function createManagedPerson(scene, opts) {
  const {
    x, y, skinId,
    texture = `person-stand-${skinId}`,
    greeting = null,
    depth = 2,
    event = "managed",
    flip = false,
    flagKey = null,
    carriedGoods = null,
  } = opts;

  const sprite = scene.add.image(x, y, texture)
    .setScale(SCALE).setDepth(depth);
  if (flip) sprite.setFlipX(true);

  const personEntry = {
    sprite,
    skinId,
    state: "idle",
    greeting,
    noGreet: true,
    scatterPanic: true,
    returnHome: { x, y, event },
    bubble: null,
    waveTimer: 0, waveFrame: 0,
    runAngle: 0, runTimer: 0, runFrame: 0,
    wanderTimer: 0, wanderDuration: 999, wanderAngle: null,
    hideTarget: null,
    homeX: x, homeY: y,
    carriedGoods,
    managedBySetPiece: true,
  };
  if (flagKey) personEntry[flagKey] = true;
  scene.people.push(personEntry);

  return { sprite, personEntry };
}
