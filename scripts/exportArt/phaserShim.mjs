// Minimal stand-in for the real `phaser` package, used only when running the
// procedural texture generators (src/textures/*.js) outside a browser via
// scripts/exportArt/run.mjs. The generators only ever touch
// `Phaser.Math.RandomDataGenerator`, so that's all this shim provides.

function hashSeeds(seeds) {
  const str = Array.isArray(seeds) ? seeds.join('|') : String(seeds ?? '');
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

// mulberry32 PRNG
function makeRng(seed) {
  let a = seed || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RandomDataGenerator {
  constructor(seeds = [Date.now().toString()]) {
    this._rng = makeRng(hashSeeds(seeds));
  }
  frac() {
    return this._rng();
  }
  between(min, max) {
    return Math.floor(this._rng() * (max - min + 1)) + min;
  }
  integerInRange(min, max) {
    return this.between(min, max);
  }
  realInRange(min, max) {
    return this._rng() * (max - min) + min;
  }
  pick(array) {
    return array[Math.floor(this._rng() * array.length)];
  }
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this._rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export default { Math: { RandomDataGenerator } };
