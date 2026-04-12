import Phaser from 'phaser';

export function generateEffectTextures(scene) {
  // --- Missile (4x4) ---
  const missileCanvas = scene.textures.createCanvas('missile', 4, 8);
  const mc = missileCanvas.context;
  mc.fillStyle = '#fff';
  mc.fillRect(1, 0, 2, 6);
  mc.fillStyle = '#f00';
  mc.fillRect(0, 6, 4, 2);
  mc.fillRect(1, 5, 2, 1);
  missileCanvas.refresh();

  // --- Cute symbols (10x10 each) ---
  // Heart
  const heartCanvas = scene.textures.createCanvas('heart', 10, 10);
  const hc = heartCanvas.context;
  hc.fillStyle = '#ff4488';
  // Top bumps
  hc.fillRect(1, 1, 3, 3);
  hc.fillRect(6, 1, 3, 3);
  hc.fillRect(0, 2, 2, 2);
  hc.fillRect(8, 2, 2, 2);
  // Middle fill
  hc.fillRect(0, 3, 10, 2);
  hc.fillRect(1, 5, 8, 1);
  hc.fillRect(2, 6, 6, 1);
  hc.fillRect(3, 7, 4, 1);
  hc.fillRect(4, 8, 2, 1);
  // Highlight
  hc.fillStyle = '#ff88aa';
  hc.fillRect(2, 2, 1, 1);
  heartCanvas.refresh();

  // Flower
  const flowerCanvas = scene.textures.createCanvas('flower', 10, 10);
  const fc = flowerCanvas.context;
  // Petals
  fc.fillStyle = '#ff88cc';
  fc.fillRect(4, 0, 2, 3);  // top
  fc.fillRect(4, 7, 2, 3);  // bottom
  fc.fillRect(0, 4, 3, 2);  // left
  fc.fillRect(7, 4, 3, 2);  // right
  // Diagonal petals
  fc.fillStyle = '#ffaadd';
  fc.fillRect(1, 1, 2, 2);
  fc.fillRect(7, 1, 2, 2);
  fc.fillRect(1, 7, 2, 2);
  fc.fillRect(7, 7, 2, 2);
  // Center
  fc.fillStyle = '#ffee00';
  fc.fillRect(4, 4, 2, 2);
  fc.fillRect(3, 4, 1, 2);
  fc.fillRect(6, 4, 1, 2);
  flowerCanvas.refresh();

  // Smiley
  const smileyCanvas = scene.textures.createCanvas('smiley', 10, 10);
  const smc = smileyCanvas.context;
  // Face
  smc.fillStyle = '#ffdd00';
  smc.fillRect(2, 0, 6, 1);
  smc.fillRect(1, 1, 8, 1);
  smc.fillRect(0, 2, 10, 6);
  smc.fillRect(1, 8, 8, 1);
  smc.fillRect(2, 9, 6, 1);
  // Eyes
  smc.fillStyle = '#222';
  smc.fillRect(2, 3, 2, 2);
  smc.fillRect(6, 3, 2, 2);
  // Smile
  smc.fillRect(2, 6, 1, 1);
  smc.fillRect(3, 7, 4, 1);
  smc.fillRect(7, 6, 1, 1);
  smileyCanvas.refresh();

  // Star
  const starCanvas = scene.textures.createCanvas('star', 10, 10);
  const stc = starCanvas.context;
  stc.fillStyle = '#ffee44';
  stc.fillRect(4, 0, 2, 3);   // top spike
  stc.fillRect(0, 3, 10, 3);  // middle bar
  stc.fillRect(2, 2, 6, 1);   // upper fill
  stc.fillRect(2, 7, 6, 1);   // lower fill
  stc.fillRect(4, 7, 2, 3);   // bottom spike
  stc.fillRect(1, 6, 2, 2);   // bottom-left
  stc.fillRect(7, 6, 2, 2);   // bottom-right
  stc.fillStyle = '#fff';
  stc.fillRect(5, 4, 1, 1);   // sparkle
  starCanvas.refresh();

  // Rainbow
  const rainbowCanvas = scene.textures.createCanvas('rainbow', 10, 10);
  const rbc = rainbowCanvas.context;
  const arcColors = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0088ff'];
  for (let i = 0; i < 5; i++) {
    rbc.fillStyle = arcColors[i];
    rbc.fillRect(1, 2 + i, 8, 1);
  }
  // Rounded top
  rbc.fillStyle = '#ff0000';
  rbc.fillRect(2, 1, 6, 1);
  rbc.fillRect(3, 0, 4, 1);
  // Clouds
  rbc.fillStyle = '#fff';
  rbc.fillRect(0, 7, 3, 3);
  rbc.fillRect(7, 7, 3, 3);
  rainbowCanvas.refresh();

  // --- Explosion spritesheet (5 frames, 24x24 each) ---
  const expCanvas = scene.textures.createCanvas('explosion-sheet', 120, 24);
  const ec = expCanvas.context;
  const colors = ['#ff0', '#f80', '#f00', '#a00', '#444'];
  const sizes = [4, 8, 12, 10, 6];
  for (let i = 0; i < 5; i++) {
    const cx = i * 24 + 12;
    const cy = 12;
    const r = sizes[i];
    ec.fillStyle = colors[i];
    // Pixelated circle
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          ec.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
    // Inner color
    if (i < 3) {
      ec.fillStyle = '#fff';
      const ir = Math.max(1, r - 3);
      for (let y = -ir; y <= ir; y++) {
        for (let x = -ir; x <= ir; x++) {
          if (x * x + y * y <= ir * ir) {
            ec.fillRect(cx + x, cy + y, 1, 1);
          }
        }
      }
    }
  }
  expCanvas.refresh();
  scene.textures.get('explosion-sheet').add(0, 0, 0, 0, 24, 24);
  scene.textures.get('explosion-sheet').add(1, 0, 24, 0, 24, 24);
  scene.textures.get('explosion-sheet').add(2, 0, 48, 0, 24, 24);
  scene.textures.get('explosion-sheet').add(3, 0, 72, 0, 24, 24);
  scene.textures.get('explosion-sheet').add(4, 0, 96, 0, 24, 24);

  // --- Targeting reticle (12x12) ---
  const retCanvas = scene.textures.createCanvas('reticle', 12, 12);
  const rc = retCanvas.context;
  rc.fillStyle = '#f00';
  // Crosshair
  rc.fillRect(5, 0, 2, 4);
  rc.fillRect(5, 8, 2, 4);
  rc.fillRect(0, 5, 4, 2);
  rc.fillRect(8, 5, 4, 2);
  // Center dot
  rc.fillStyle = '#ff0';
  rc.fillRect(5, 5, 2, 2);
  retCanvas.refresh();

  // --- Laser dot (4x4) ---
  const laserCanvas = scene.textures.createCanvas('laser-dot', 4, 4);
  const lc = laserCanvas.context;
  lc.fillStyle = '#f00';
  lc.fillRect(1, 0, 2, 1);
  lc.fillRect(0, 1, 4, 2);
  lc.fillRect(1, 3, 2, 1);
  laserCanvas.refresh();

  // --- Building damage cracks overlay (16x16) ---
  const crackCanvas = scene.textures.createCanvas('cracks', 16, 16);
  const ckc = crackCanvas.context;
  ckc.fillStyle = '#222';
  ckc.fillRect(3, 1, 1, 4);
  ckc.fillRect(4, 4, 1, 3);
  ckc.fillRect(5, 6, 1, 2);
  ckc.fillRect(10, 2, 1, 3);
  ckc.fillRect(9, 5, 1, 2);
  ckc.fillRect(11, 5, 1, 4);
  ckc.fillRect(6, 10, 1, 3);
  ckc.fillRect(7, 12, 1, 2);
  ckc.fillRect(12, 9, 1, 3);
  ckc.fillRect(13, 11, 1, 2);
  crackCanvas.refresh();

  // --- Fire/smoke overlay (8x8) ---
  const fireCanvas = scene.textures.createCanvas('fire', 8, 8);
  const fic = fireCanvas.context;
  fic.fillStyle = '#f80';
  fic.fillRect(2, 3, 4, 4);
  fic.fillRect(3, 2, 2, 1);
  fic.fillStyle = '#ff0';
  fic.fillRect(3, 4, 2, 2);
  fic.fillStyle = '#f00';
  fic.fillRect(1, 6, 2, 2);
  fic.fillRect(5, 5, 2, 2);
  fireCanvas.refresh();

  // --- Smoke puff (8x8) ---
  const smokeCanvas = scene.textures.createCanvas('smoke', 8, 8);
  const skc = smokeCanvas.context;
  skc.fillStyle = '#666';
  skc.fillRect(2, 2, 4, 4);
  skc.fillRect(1, 3, 6, 2);
  skc.fillRect(3, 1, 2, 1);
  skc.fillStyle = '#888';
  skc.fillRect(3, 3, 2, 2);
  smokeCanvas.refresh();

  // --- Rubble (16x16) ---
  const rubbleCanvas = scene.textures.createCanvas('rubble', 16, 16);
  const rbl = rubbleCanvas.context;
  const rblRng = new Phaser.Math.RandomDataGenerator(['rubble']);
  for (let i = 0; i < 30; i++) {
    rbl.fillStyle = rblRng.pick(['#555', '#666', '#777', '#888', '#443', '#554']);
    const rx = rblRng.between(0, 14);
    const ry = rblRng.between(0, 14);
    rbl.fillRect(rx, ry, rblRng.between(1, 3), rblRng.between(1, 2));
  }
  rubbleCanvas.refresh();
}
