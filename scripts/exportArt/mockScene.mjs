// Stand-in for the slice of Phaser's `Scene.textures` API that
// src/textures/*.js generators rely on: createCanvas(key, w, h) plus the
// texture-manager lookups used for spritesheet frame bookkeeping. Backed by
// node-canvas so the exact same drawing code produces real PNG-able canvases.
import { createCanvas } from 'canvas';

export function createMockScene() {
  const canvases = new Map(); // key -> { canvas, width, height }

  const textureManager = {
    createCanvas(key, width, height) {
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');
      canvases.set(key, { canvas, width, height });
      return {
        canvas,
        context,
        refresh() {},
      };
    },
    get(key) {
      return {
        key,
        add() {},
      };
    },
    exists(key) {
      return canvases.has(key);
    },
  };

  return {
    scene: { textures: textureManager },
    canvases,
  };
}
