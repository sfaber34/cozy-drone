import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { MobileControlsScene } from './scenes/MobileControlsScene.js';
import { MOBILE_ZOOM_FACTOR } from './constants.js';

// --- Pixel-perfect mobile zoom via larger internal canvas -----------------
//
// On mobile we want a "zoomed-out" view (more world visible around the drone)
// WITHOUT using camera.setZoom at a fractional value, because nearest-
// neighbor rasterization at fractional camera zoom causes visible texel
// flicker as the camera drifts sub-pixel. The clean approach Celeste-style
// pixel-art games use: render Phaser at an INTERNAL resolution LARGER than
// the viewport (so the camera at zoom=1 sees more world), then let the
// browser CSS-scale the whole canvas DOWN to fit the screen. The final
// downscale is a single smooth blit that never jitters; inside the game
// every texel still maps to an integer number of internal pixels.
//
// Scale mode is NONE because we manage the internal vs. CSS size ourselves.
// Phaser.Scale.RESIZE would forcibly re-sync gameSize to the parent on
// every window resize, fighting our override.
const isTouch =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function computeSizes() {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  // Scale factor for the internal canvas. On mobile, MOBILE_ZOOM_FACTOR < 1
  // means we want to see MORE world → internal size is larger than viewport.
  const factor = isTouch && MOBILE_ZOOM_FACTOR > 0 ? 1 / MOBILE_ZOOM_FACTOR : 1;
  return {
    internalW: Math.max(1, Math.round(viewW * factor)),
    internalH: Math.max(1, Math.round(viewH * factor)),
    cssW: viewW,
    cssH: viewH,
  };
}

const initial = computeSizes();

const config = {
  type: Phaser.WEBGL,
  pixelArt: true,
  backgroundColor: '#d2b48c',
  scale: {
    mode: Phaser.Scale.NONE,
    width: initial.internalW,
    height: initial.internalH,
    parent: document.body,
  },
  scene: [BootScene, GameScene, MobileControlsScene],
  input: {
    activePointers: 4, // support 4 simultaneous touch points for multi-touch
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  audio: {
    noAudio: false,
  },
};

const game = new Phaser.Game(config);

// Apply the internal → CSS size split. Run on every resize / orientation
// change so an orientation flip or browser-chrome hide/show re-syncs.
function applyDisplaySize() {
  const { internalW, internalH, cssW, cssH } = computeSizes();
  // Resize Phaser's internal gameSize (where every `scale.width`/`scale.height`
  // read lives, and where the camera renders). Canvas CSS size is then forced
  // to the viewport so the browser downscales the canvas to fit.
  game.scale.resize(internalW, internalH);
  game.canvas.style.width = cssW + 'px';
  game.canvas.style.height = cssH + 'px';
}

applyDisplaySize();
window.addEventListener('resize', applyDisplaySize);
window.addEventListener('orientationchange', applyDisplaySize);
if (window.visualViewport) {
  // iOS/Android browser chrome show/hide fires here, not on plain resize.
  window.visualViewport.addEventListener('resize', applyDisplaySize);
}

// Try to unlock audio context as early as possible
if (game.sound && game.sound.context) {
  game.sound.context.resume();
}
