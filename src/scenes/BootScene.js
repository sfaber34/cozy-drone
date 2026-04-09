import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.generateTextures();
    this.scene.start('Game');
  }

  generateTextures() {
    // --- Drone (top-down fixed-wing Predator/Global Hawk style, 32x32) ---
    const droneCanvas = this.textures.createCanvas('drone', 32, 32);
    const dc = droneCanvas.context;

    // Fuselage (long, slender) — nose at top
    dc.fillStyle = '#b0b0b0';
    dc.fillRect(14, 2, 4, 24);   // main fuselage
    dc.fillStyle = '#a0a0a0';
    dc.fillRect(15, 1, 2, 1);    // nose tip
    dc.fillStyle = '#c0c0c0';
    dc.fillRect(15, 3, 2, 4);    // cockpit/sensor bulge highlight

    // Sensor dome (nose)
    dc.fillStyle = '#2a2a2a';
    dc.fillRect(15, 1, 2, 2);    // dark sensor ball

    // Main wings (long, thin, swept — positioned mid-body)
    dc.fillStyle = '#989898';
    dc.fillRect(4, 12, 10, 2);   // left wing
    dc.fillRect(18, 12, 10, 2);  // right wing
    // Wing taper
    dc.fillStyle = '#909090';
    dc.fillRect(2, 13, 2, 1);    // left wingtip
    dc.fillRect(28, 13, 2, 1);   // right wingtip
    // Wing root blend
    dc.fillStyle = '#a8a8a8';
    dc.fillRect(12, 11, 2, 2);
    dc.fillRect(18, 11, 2, 2);

    // Engine intake bumps on fuselage
    dc.fillStyle = '#808080';
    dc.fillRect(13, 16, 1, 3);
    dc.fillRect(18, 16, 1, 3);

    // V-tail (rear stabilizers)
    dc.fillStyle = '#888';
    dc.fillRect(10, 24, 4, 2);   // left tail
    dc.fillRect(18, 24, 4, 2);   // right tail
    dc.fillStyle = '#808080';
    dc.fillRect(9, 25, 1, 1);    // left tail tip
    dc.fillRect(22, 25, 1, 1);   // right tail tip

    // Rear prop hub
    dc.fillStyle = '#555';
    dc.fillRect(15, 26, 2, 2);

    // Hardpoints (weapon pylons under wings)
    dc.fillStyle = '#666';
    dc.fillRect(8, 13, 1, 1);
    dc.fillRect(23, 13, 1, 1);

    // Subtle panel lines
    dc.fillStyle = '#999';
    dc.fillRect(15, 8, 2, 1);
    dc.fillRect(15, 20, 2, 1);

    // Propeller frame 1 (horizontal blade)
    dc.fillStyle = '#aaa';
    dc.fillRect(12, 28, 8, 1);
    dc.fillStyle = '#ccc';
    dc.fillRect(13, 28, 6, 1);

    droneCanvas.refresh();

    // --- Drone frame 2 (propeller vertical) ---
    const drone2Canvas = this.textures.createCanvas('drone2', 32, 32);
    const dc2 = drone2Canvas.context;
    // Copy the same airframe
    dc2.drawImage(droneCanvas.canvas, 0, 0);
    // Erase the horizontal prop from frame 1
    dc2.clearRect(12, 28, 8, 1);
    // Draw vertical blade instead
    dc2.fillStyle = '#aaa';
    dc2.fillRect(15, 26, 2, 5);
    dc2.fillStyle = '#ccc';
    dc2.fillRect(15, 27, 2, 3);
    drone2Canvas.refresh();

    // --- Drone shadow (same silhouette, semi-transparent) ---
    const shadowCanvas = this.textures.createCanvas('drone-shadow', 32, 32);
    const sc = shadowCanvas.context;
    sc.globalAlpha = 0.3;
    sc.fillStyle = '#000';
    // Fuselage
    sc.fillRect(14, 2, 4, 24);
    sc.fillRect(15, 1, 2, 1);
    // Wings
    sc.fillRect(4, 12, 24, 2);
    sc.fillRect(2, 13, 2, 1);
    sc.fillRect(28, 13, 2, 1);
    // Tail
    sc.fillRect(10, 24, 4, 2);
    sc.fillRect(18, 24, 4, 2);
    shadowCanvas.refresh();

    // --- Tank (top-down, 12x16) ---
    const tankCanvas = this.textures.createCanvas('tank', 12, 16);
    const tc = tankCanvas.context;
    // Treads
    tc.fillStyle = '#2a2a1a';
    tc.fillRect(0, 1, 3, 14);
    tc.fillRect(9, 1, 3, 14);
    // Body
    tc.fillStyle = '#5a6e3a';
    tc.fillRect(2, 2, 8, 12);
    // Turret
    tc.fillStyle = '#4a5e2a';
    tc.fillRect(3, 5, 6, 6);
    // Barrel
    tc.fillStyle = '#3a3a2a';
    tc.fillRect(5, 0, 2, 6);
    tankCanvas.refresh();

    // --- Tank destroyed ---
    const tankDeadCanvas = this.textures.createCanvas('tank-dead', 12, 16);
    const td = tankDeadCanvas.context;
    // Burned treads
    td.fillStyle = '#1a1a0a';
    td.fillRect(0, 1, 3, 14);
    td.fillRect(9, 1, 3, 14);
    // Burned body
    td.fillStyle = '#2a2a1a';
    td.fillRect(2, 2, 8, 12);
    // Destroyed turret
    td.fillStyle = '#1a1a0a';
    td.fillRect(3, 5, 6, 6);
    // Fire pixels
    td.fillStyle = '#f80';
    td.fillRect(4, 6, 2, 2);
    td.fillStyle = '#f00';
    td.fillRect(6, 8, 2, 2);
    td.fillStyle = '#ff0';
    td.fillRect(5, 7, 1, 1);
    tankDeadCanvas.refresh();

    // --- Missile (4x4) ---
    const missileCanvas = this.textures.createCanvas('missile', 4, 8);
    const mc = missileCanvas.context;
    mc.fillStyle = '#fff';
    mc.fillRect(1, 0, 2, 6);
    mc.fillStyle = '#f00';
    mc.fillRect(0, 6, 4, 2);
    mc.fillRect(1, 5, 2, 1);
    missileCanvas.refresh();

    // --- Cute symbols (10x10 each) ---
    // Heart
    const heartCanvas = this.textures.createCanvas('heart', 10, 10);
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
    const flowerCanvas = this.textures.createCanvas('flower', 10, 10);
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
    const smileyCanvas = this.textures.createCanvas('smiley', 10, 10);
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
    const starCanvas = this.textures.createCanvas('star', 10, 10);
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
    const rainbowCanvas = this.textures.createCanvas('rainbow', 10, 10);
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
    const expCanvas = this.textures.createCanvas('explosion-sheet', 120, 24);
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
    this.textures.get('explosion-sheet').add(0, 0, 0, 0, 24, 24);
    this.textures.get('explosion-sheet').add(1, 0, 24, 0, 24, 24);
    this.textures.get('explosion-sheet').add(2, 0, 48, 0, 24, 24);
    this.textures.get('explosion-sheet').add(3, 0, 72, 0, 24, 24);
    this.textures.get('explosion-sheet').add(4, 0, 96, 0, 24, 24);

    // --- Targeting reticle (12x12) ---
    const retCanvas = this.textures.createCanvas('reticle', 12, 12);
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

    // --- Desert tiles (16x16 each, 4 variants) ---
    const tileCanvas = this.textures.createCanvas('desert-tiles', 64, 16);
    const dtc = tileCanvas.context;
    const baseSands = ['#d2b48c', '#c8a878', '#dcc09a', '#bfa06e'];
    for (let t = 0; t < 4; t++) {
      dtc.fillStyle = baseSands[t];
      dtc.fillRect(t * 16, 0, 16, 16);
      // Scatter some noise pixels
      const rng = new Phaser.Math.RandomDataGenerator([`tile${t}`]);
      for (let i = 0; i < 12; i++) {
        const shade = rng.pick(['#c8a070', '#b89060', '#dcc898', '#e0d0a0']);
        dtc.fillStyle = shade;
        dtc.fillRect(t * 16 + rng.between(0, 15), rng.between(0, 15), 1, 1);
      }
    }
    tileCanvas.refresh();
    for (let i = 0; i < 4; i++) {
      this.textures.get('desert-tiles').add(i, 0, i * 16, 0, 16, 16);
    }

    // --- Laser dot (4x4) ---
    const laserCanvas = this.textures.createCanvas('laser-dot', 4, 4);
    const lc = laserCanvas.context;
    lc.fillStyle = '#f00';
    lc.fillRect(1, 0, 2, 1);
    lc.fillRect(0, 1, 4, 2);
    lc.fillRect(1, 3, 2, 1);
    laserCanvas.refresh();

    // --- Rock (8x8) ---
    const rockCanvas = this.textures.createCanvas('rock', 8, 8);
    const rkc = rockCanvas.context;
    rkc.fillStyle = '#8a7a6a';
    rkc.fillRect(2, 1, 4, 6);
    rkc.fillRect(1, 2, 6, 4);
    rkc.fillStyle = '#9a8a7a';
    rkc.fillRect(3, 2, 2, 3);
    rockCanvas.refresh();

    // --- Scrub brush (8x8) ---
    const brushCanvas = this.textures.createCanvas('brush', 8, 8);
    const bc = brushCanvas.context;
    bc.fillStyle = '#6a8a3a';
    bc.fillRect(2, 3, 4, 4);
    bc.fillRect(3, 2, 2, 1);
    bc.fillStyle = '#5a7a2a';
    bc.fillRect(1, 4, 1, 2);
    bc.fillRect(6, 4, 1, 2);
    bc.fillStyle = '#4a6a1a';
    bc.fillRect(3, 5, 1, 1);
    brushCanvas.refresh();
  }
}
