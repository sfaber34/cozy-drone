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

    // --- Person skins (10 variants with Middle Eastern clothing) ---
    // Each skin: {skin, robe, headwear, headColor, shoes}
    const personSkins = [
      // 1: White thobe, red keffiyeh
      { skin: '#d4a574', robe: '#f0ece0', head: '#cc3333', headType: 'keffiyeh', shoes: '#8a6a3a', accent: '#aa2222' },
      // 2: Beige dishdasha, white keffiyeh
      { skin: '#c49a6c', robe: '#e8dcc8', head: '#fff', headType: 'keffiyeh', shoes: '#5a3a1a', accent: '#222' },
      // 3: Blue thobe, white kufi cap
      { skin: '#d4a574', robe: '#4477aa', head: '#eee', headType: 'kufi', shoes: '#333', accent: '#335588' },
      // 4: Dark robe, black agal+keffiyeh
      { skin: '#c49a6c', robe: '#3a3a3a', head: '#ddd', headType: 'keffiyeh', shoes: '#222', accent: '#111' },
      // 5: Green thobe, brown kufi
      { skin: '#b8885c', robe: '#5a7a4a', head: '#8a6a3a', headType: 'kufi', shoes: '#4a3a1a', accent: '#3a5a2a' },
      // 6: Woman — dark abaya, colored hijab
      { skin: '#d4a574', robe: '#2a2a2a', head: '#884488', headType: 'hijab', shoes: '#333', accent: '#2a2a2a' },
      // 7: Woman — navy abaya, blue hijab
      { skin: '#c49a6c', robe: '#2a3a5a', head: '#4466aa', headType: 'hijab', shoes: '#2a2a3a', accent: '#1a2a4a' },
      // 8: Light brown robe, orange keffiyeh
      { skin: '#b8885c', robe: '#c8b088', head: '#dd8833', headType: 'keffiyeh', shoes: '#6a4a2a', accent: '#bb6622' },
      // 9: Woman — maroon abaya, cream hijab
      { skin: '#d4a574', robe: '#6a2a2a', head: '#e8dcc8', headType: 'hijab', shoes: '#4a2a1a', accent: '#5a1a1a' },
      // 10: White thobe, white kufi, older (grey beard hint)
      { skin: '#c49a6c', robe: '#f0ece0', head: '#ddd', headType: 'kufi', shoes: '#6a5a3a', accent: '#bbb' },
    ];

    const drawPersonHead = (ctx, s, yOff) => {
      // Head
      ctx.fillStyle = s.skin;
      ctx.fillRect(3, yOff, 4, 4);
      // Eyes
      ctx.fillStyle = '#222';
      ctx.fillRect(4, yOff + 1, 1, 1);
      ctx.fillRect(6, yOff + 1, 1, 1);

      if (s.headType === 'keffiyeh') {
        // Keffiyeh drapes over head and sides
        ctx.fillStyle = s.head;
        ctx.fillRect(3, yOff, 4, 1);     // top
        ctx.fillRect(2, yOff, 1, 3);     // left drape
        ctx.fillRect(7, yOff, 1, 3);     // right drape
        // Agal (band)
        ctx.fillStyle = s.accent;
        ctx.fillRect(3, yOff, 4, 1);
      } else if (s.headType === 'kufi') {
        // Kufi cap on top
        ctx.fillStyle = s.head;
        ctx.fillRect(3, yOff, 4, 1);
        ctx.fillRect(2, yOff, 1, 1);
        ctx.fillRect(7, yOff, 1, 1);
      } else if (s.headType === 'hijab') {
        // Hijab wraps head
        ctx.fillStyle = s.head;
        ctx.fillRect(2, yOff, 6, 2);
        ctx.fillRect(2, yOff + 2, 1, 2);
        ctx.fillRect(7, yOff + 2, 1, 2);
        ctx.fillRect(3, yOff, 4, 1);
        // Re-draw eyes on top
        ctx.fillStyle = '#222';
        ctx.fillRect(4, yOff + 1, 1, 1);
        ctx.fillRect(6, yOff + 1, 1, 1);
      }
    };

    for (let si = 0; si < personSkins.length; si++) {
      const s = personSkins[si];
      const suffix = si; // 0-9

      // --- Standing ---
      const standC = this.textures.createCanvas(`person-stand-${suffix}`, 10, 14);
      const sc = standC.context;
      drawPersonHead(sc, s, 0);
      sc.fillStyle = '#c44';
      sc.fillRect(5, 3, 1, 1);      // mouth
      sc.fillStyle = s.robe;
      sc.fillRect(3, 4, 4, 6);      // thobe/abaya (longer)
      sc.fillStyle = s.skin;
      sc.fillRect(2, 5, 1, 3);      // arms
      sc.fillRect(7, 5, 1, 3);
      sc.fillStyle = s.robe;
      sc.fillRect(3, 9, 2, 3);      // robe bottom / legs
      sc.fillRect(5, 9, 2, 3);
      sc.fillStyle = s.shoes;
      sc.fillRect(3, 12, 2, 2);     // sandals/shoes
      sc.fillRect(5, 12, 2, 2);
      standC.refresh();

      // --- Wave frame 1 ---
      const wave1C = this.textures.createCanvas(`person-wave1-${suffix}`, 10, 14);
      const w1 = wave1C.context;
      drawPersonHead(w1, s, 0);
      w1.fillStyle = '#c44';
      w1.fillRect(4, 3, 1, 1);
      w1.fillRect(5, 3, 1, 1);
      w1.fillRect(6, 3, 1, 1);
      w1.fillStyle = s.robe;
      w1.fillRect(3, 4, 4, 6);
      w1.fillStyle = s.skin;
      w1.fillRect(2, 5, 1, 3);
      w1.fillRect(7, 4, 1, 1);
      w1.fillRect(8, 3, 1, 1);
      w1.fillRect(9, 2, 1, 1);
      w1.fillStyle = s.robe;
      w1.fillRect(3, 9, 2, 3);
      w1.fillRect(5, 9, 2, 3);
      w1.fillStyle = s.shoes;
      w1.fillRect(3, 12, 2, 2);
      w1.fillRect(5, 12, 2, 2);
      wave1C.refresh();

      // --- Wave frame 2 ---
      const wave2C = this.textures.createCanvas(`person-wave2-${suffix}`, 10, 14);
      const w2 = wave2C.context;
      drawPersonHead(w2, s, 0);
      w2.fillStyle = '#c44';
      w2.fillRect(4, 3, 1, 1);
      w2.fillRect(5, 3, 1, 1);
      w2.fillRect(6, 3, 1, 1);
      w2.fillStyle = s.robe;
      w2.fillRect(3, 4, 4, 6);
      w2.fillStyle = s.skin;
      w2.fillRect(2, 5, 1, 3);
      w2.fillRect(7, 4, 1, 1);
      w2.fillRect(8, 2, 1, 1);
      w2.fillRect(9, 1, 1, 1);
      w2.fillStyle = s.robe;
      w2.fillRect(3, 9, 2, 3);
      w2.fillRect(5, 9, 2, 3);
      w2.fillStyle = s.shoes;
      w2.fillRect(3, 12, 2, 2);
      w2.fillRect(5, 12, 2, 2);
      wave2C.refresh();

      // --- Run frame 1 ---
      const run1C = this.textures.createCanvas(`person-run1-${suffix}`, 10, 14);
      const r1 = run1C.context;
      drawPersonHead(r1, s, 0);
      r1.fillStyle = '#c44';
      r1.fillRect(5, 2, 1, 2);
      r1.fillStyle = s.robe;
      r1.fillRect(3, 4, 4, 5);
      r1.fillStyle = s.skin;
      r1.fillRect(1, 4, 2, 1);
      r1.fillRect(7, 5, 2, 1);
      r1.fillStyle = s.robe;
      r1.fillRect(3, 9, 2, 3);
      r1.fillRect(6, 9, 2, 2);
      r1.fillStyle = s.shoes;
      r1.fillRect(3, 12, 2, 2);
      r1.fillRect(6, 11, 2, 2);
      run1C.refresh();

      // --- Run frame 2 ---
      const run2C = this.textures.createCanvas(`person-run2-${suffix}`, 10, 14);
      const r2 = run2C.context;
      drawPersonHead(r2, s, 0);
      r2.fillStyle = '#c44';
      r2.fillRect(5, 2, 1, 2);
      r2.fillStyle = s.robe;
      r2.fillRect(3, 4, 4, 5);
      r2.fillStyle = s.skin;
      r2.fillRect(1, 5, 2, 1);
      r2.fillRect(7, 4, 2, 1);
      r2.fillStyle = s.robe;
      r2.fillRect(3, 9, 2, 2);
      r2.fillRect(6, 9, 2, 3);
      r2.fillStyle = s.shoes;
      r2.fillRect(3, 11, 2, 2);
      r2.fillRect(6, 12, 2, 2);
      run2C.refresh();
    }


    // --- Bride (10x14) ---
    const brideCanvas = this.textures.createCanvas('bride', 10, 14);
    const brc = brideCanvas.context;
    // Veil
    brc.fillStyle = '#fff';
    brc.fillRect(2, 0, 6, 3);
    // Head
    brc.fillStyle = '#d4a574';
    brc.fillRect(3, 1, 4, 3);
    // Eyes
    brc.fillStyle = '#222';
    brc.fillRect(4, 2, 1, 1);
    brc.fillRect(6, 2, 1, 1);
    // Smile
    brc.fillStyle = '#c44';
    brc.fillRect(4, 3, 3, 1);
    // White dress
    brc.fillStyle = '#fff';
    brc.fillRect(3, 4, 4, 3);
    brc.fillRect(2, 7, 6, 4);
    brc.fillRect(1, 9, 8, 3);
    // Dress detail
    brc.fillStyle = '#eee';
    brc.fillRect(3, 8, 4, 1);
    // Bouquet
    brc.fillStyle = '#ff6688';
    brc.fillRect(2, 5, 2, 2);
    brc.fillStyle = '#66cc44';
    brc.fillRect(2, 7, 1, 1);
    brc.fillRect(3, 7, 1, 1);
    // Shoes
    brc.fillStyle = '#eeddcc';
    brc.fillRect(3, 12, 2, 2);
    brc.fillRect(5, 12, 2, 2);
    brideCanvas.refresh();

    // --- Groom (10x14) ---
    const groomCanvas = this.textures.createCanvas('groom', 10, 14);
    const gmc = groomCanvas.context;
    // Head + keffiyeh
    gmc.fillStyle = '#c49a6c';
    gmc.fillRect(3, 0, 4, 4);
    gmc.fillStyle = '#fff';
    gmc.fillRect(3, 0, 4, 1);
    gmc.fillRect(2, 0, 1, 3);
    gmc.fillRect(7, 0, 1, 3);
    // Gold agal
    gmc.fillStyle = '#cc9933';
    gmc.fillRect(3, 0, 4, 1);
    // Eyes
    gmc.fillStyle = '#222';
    gmc.fillRect(4, 1, 1, 1);
    gmc.fillRect(6, 1, 1, 1);
    // Smile
    gmc.fillStyle = '#c44';
    gmc.fillRect(4, 3, 3, 1);
    // White bisht (formal robe)
    gmc.fillStyle = '#f0ece0';
    gmc.fillRect(3, 4, 4, 6);
    // Gold trim
    gmc.fillStyle = '#cc9933';
    gmc.fillRect(3, 4, 1, 6);
    gmc.fillRect(6, 4, 1, 6);
    gmc.fillRect(4, 4, 2, 1);
    // Arms
    gmc.fillStyle = '#c49a6c';
    gmc.fillRect(2, 5, 1, 3);
    gmc.fillRect(7, 5, 1, 3);
    // Legs/robe bottom
    gmc.fillStyle = '#f0ece0';
    gmc.fillRect(3, 9, 2, 3);
    gmc.fillRect(5, 9, 2, 3);
    // Shoes
    gmc.fillStyle = '#5a3a1a';
    gmc.fillRect(3, 12, 2, 2);
    gmc.fillRect(5, 12, 2, 2);
    groomCanvas.refresh();

    // --- Priest/Imam (10x14) ---
    const priestCanvas = this.textures.createCanvas('priest', 10, 14);
    const prc = priestCanvas.context;
    // Head
    prc.fillStyle = '#c49a6c';
    prc.fillRect(3, 0, 4, 4);
    // White turban
    prc.fillStyle = '#fff';
    prc.fillRect(2, 0, 6, 2);
    prc.fillRect(3, 0, 4, 1);
    // Beard
    prc.fillStyle = '#888';
    prc.fillRect(4, 3, 2, 2);
    // Eyes
    prc.fillStyle = '#222';
    prc.fillRect(4, 1, 1, 1);
    prc.fillRect(6, 1, 1, 1);
    // Long dark robe
    prc.fillStyle = '#2a3a2a';
    prc.fillRect(3, 5, 4, 5);
    prc.fillRect(2, 6, 6, 4);
    // Book in hand
    prc.fillStyle = '#6a4a2a';
    prc.fillRect(1, 6, 2, 2);
    prc.fillStyle = '#f0ece0';
    prc.fillRect(1, 6, 2, 1);
    // Arms
    prc.fillStyle = '#c49a6c';
    prc.fillRect(2, 5, 1, 1);
    prc.fillRect(7, 5, 1, 3);
    // Robe bottom
    prc.fillStyle = '#2a3a2a';
    prc.fillRect(3, 10, 2, 2);
    prc.fillRect(5, 10, 2, 2);
    // Shoes
    prc.fillStyle = '#333';
    prc.fillRect(3, 12, 2, 2);
    prc.fillRect(5, 12, 2, 2);
    priestCanvas.refresh();

    // --- Wedding arch (top-down, 20x16) ---
    const archCanvas = this.textures.createCanvas('wedding-arch', 20, 16);
    const arc = archCanvas.context;
    // Posts
    arc.fillStyle = '#ddd';
    arc.fillRect(0, 2, 2, 14);
    arc.fillRect(18, 2, 2, 14);
    // Top beam
    arc.fillStyle = '#eee';
    arc.fillRect(0, 0, 20, 3);
    // Draping fabric
    arc.fillStyle = '#fff';
    arc.fillRect(2, 1, 16, 2);
    // Flowers on arch
    arc.fillStyle = '#ff88aa';
    arc.fillRect(3, 0, 2, 2);
    arc.fillRect(8, 0, 2, 2);
    arc.fillRect(15, 0, 2, 2);
    arc.fillStyle = '#ff6688';
    arc.fillRect(5, 1, 2, 1);
    arc.fillRect(11, 1, 2, 1);
    // Greenery
    arc.fillStyle = '#4a8a2a';
    arc.fillRect(1, 1, 1, 2);
    arc.fillRect(18, 1, 1, 2);
    archCanvas.refresh();

    // --- Wedding carpet/rug (24x12) ---
    const rugCanvas = this.textures.createCanvas('wedding-rug', 24, 12);
    const rgc = rugCanvas.context;
    // Main rug
    rgc.fillStyle = '#882222';
    rgc.fillRect(0, 0, 24, 12);
    // Border
    rgc.fillStyle = '#cc9933';
    rgc.fillRect(0, 0, 24, 1);
    rgc.fillRect(0, 11, 24, 1);
    rgc.fillRect(0, 0, 1, 12);
    rgc.fillRect(23, 0, 1, 12);
    // Pattern
    rgc.fillStyle = '#aa3333';
    rgc.fillRect(4, 3, 3, 3);
    rgc.fillRect(10, 3, 4, 3);
    rgc.fillRect(17, 3, 3, 3);
    rgc.fillStyle = '#cc9933';
    rgc.fillRect(5, 4, 1, 1);
    rgc.fillRect(12, 4, 1, 1);
    rgc.fillRect(18, 4, 1, 1);
    // Fringe
    rgc.fillStyle = '#cc9933';
    for (let fx = 1; fx < 24; fx += 3) {
      rgc.fillRect(fx, 11, 1, 1);
    }
    rugCanvas.refresh();

    // --- Chair/cushion (6x6) ---
    const cushionCanvas = this.textures.createCanvas('cushion', 6, 6);
    const cuc = cushionCanvas.context;
    cuc.fillStyle = '#cc8844';
    cuc.fillRect(0, 0, 6, 6);
    cuc.fillStyle = '#aa6633';
    cuc.fillRect(0, 0, 6, 1);
    cuc.fillRect(0, 5, 6, 1);
    cuc.fillStyle = '#dd9955';
    cuc.fillRect(2, 2, 2, 2);
    cushionCanvas.refresh();

    // --- Lantern (4x6) ---
    const lanternCanvas = this.textures.createCanvas('lantern', 4, 6);
    const lnc = lanternCanvas.context;
    lnc.fillStyle = '#cc8833';
    lnc.fillRect(1, 0, 2, 1);
    lnc.fillRect(0, 1, 4, 4);
    lnc.fillRect(1, 5, 2, 1);
    lnc.fillStyle = '#ffcc44';
    lnc.fillRect(1, 2, 2, 2);
    lanternCanvas.refresh();

    // --- Soccer ball (5x5) ---
    const ballCanvas = this.textures.createCanvas('soccer-ball', 5, 5);
    const sbc = ballCanvas.context;
    sbc.fillStyle = '#fff';
    sbc.fillRect(1, 0, 3, 1);
    sbc.fillRect(0, 1, 5, 3);
    sbc.fillRect(1, 4, 3, 1);
    sbc.fillStyle = '#222';
    sbc.fillRect(2, 1, 1, 1);
    sbc.fillRect(1, 2, 1, 1);
    sbc.fillRect(3, 3, 1, 1);
    ballCanvas.refresh();

    // --- Soccer goal (top-down, 20x6) ---
    const goalCanvas = this.textures.createCanvas('soccer-goal', 20, 6);
    const glc = goalCanvas.context;
    // Posts
    glc.fillStyle = '#fff';
    glc.fillRect(0, 0, 2, 6);
    glc.fillRect(18, 0, 2, 6);
    // Crossbar
    glc.fillRect(0, 0, 20, 1);
    // Net
    glc.fillStyle = '#ccc';
    for (let ny = 1; ny < 6; ny += 2) {
      for (let nx = 2; nx < 18; nx += 2) {
        glc.fillRect(nx, ny, 1, 1);
      }
    }
    goalCanvas.refresh();

    // --- Soccer field line (horizontal, 1px white) ---
    const fieldLineCanvas = this.textures.createCanvas('field-line-h', 16, 1);
    const flc = fieldLineCanvas.context;
    flc.fillStyle = '#fff';
    flc.fillRect(0, 0, 16, 1);
    fieldLineCanvas.refresh();

    // --- Soccer field line vertical ---
    const fieldLineVCanvas = this.textures.createCanvas('field-line-v', 1, 16);
    const flvc = fieldLineVCanvas.context;
    flvc.fillStyle = '#fff';
    flvc.fillRect(0, 0, 1, 16);
    fieldLineVCanvas.refresh();

    // --- Soccer player team A (red jersey, 10x14) ---
    const teamColors = [
      { jersey: '#cc2222', shorts: '#fff', name: 'team-a' },
      { jersey: '#2244cc', shorts: '#fff', name: 'team-b' },
    ];
    for (const team of teamColors) {
      // Standing
      const tsCanvas = this.textures.createCanvas(`${team.name}-stand`, 10, 14);
      const ts = tsCanvas.context;
      ts.fillStyle = '#c49a6c';
      ts.fillRect(3, 0, 4, 4);
      ts.fillStyle = '#222';
      ts.fillRect(4, 1, 1, 1);
      ts.fillRect(6, 1, 1, 1);
      ts.fillStyle = team.jersey;
      ts.fillRect(3, 4, 4, 4);
      ts.fillStyle = '#c49a6c';
      ts.fillRect(2, 5, 1, 2);
      ts.fillRect(7, 5, 1, 2);
      ts.fillStyle = team.shorts;
      ts.fillRect(3, 8, 2, 2);
      ts.fillRect(5, 8, 2, 2);
      ts.fillStyle = '#c49a6c';
      ts.fillRect(3, 10, 2, 2);
      ts.fillRect(5, 10, 2, 2);
      ts.fillStyle = '#333';
      ts.fillRect(3, 12, 2, 2);
      ts.fillRect(5, 12, 2, 2);
      tsCanvas.refresh();

      // Running frame 1
      const tr1Canvas = this.textures.createCanvas(`${team.name}-run1`, 10, 14);
      const tr1 = tr1Canvas.context;
      tr1.fillStyle = '#c49a6c';
      tr1.fillRect(3, 0, 4, 4);
      tr1.fillStyle = '#222';
      tr1.fillRect(4, 1, 1, 1);
      tr1.fillRect(6, 1, 1, 1);
      tr1.fillStyle = team.jersey;
      tr1.fillRect(3, 4, 4, 4);
      tr1.fillStyle = '#c49a6c';
      tr1.fillRect(1, 4, 2, 1);
      tr1.fillRect(7, 5, 2, 1);
      tr1.fillStyle = team.shorts;
      tr1.fillRect(3, 8, 2, 2);
      tr1.fillRect(6, 8, 2, 2);
      tr1.fillStyle = '#c49a6c';
      tr1.fillRect(3, 10, 2, 2);
      tr1.fillRect(6, 10, 1, 2);
      tr1.fillStyle = '#333';
      tr1.fillRect(3, 12, 2, 2);
      tr1.fillRect(6, 11, 2, 2);
      tr1Canvas.refresh();

      // Running frame 2
      const tr2Canvas = this.textures.createCanvas(`${team.name}-run2`, 10, 14);
      const tr2 = tr2Canvas.context;
      tr2.fillStyle = '#c49a6c';
      tr2.fillRect(3, 0, 4, 4);
      tr2.fillStyle = '#222';
      tr2.fillRect(4, 1, 1, 1);
      tr2.fillRect(6, 1, 1, 1);
      tr2.fillStyle = team.jersey;
      tr2.fillRect(3, 4, 4, 4);
      tr2.fillStyle = '#c49a6c';
      tr2.fillRect(1, 5, 2, 1);
      tr2.fillRect(7, 4, 2, 1);
      tr2.fillStyle = team.shorts;
      tr2.fillRect(3, 8, 2, 2);
      tr2.fillRect(5, 8, 2, 3);
      tr2.fillStyle = '#c49a6c';
      tr2.fillRect(3, 10, 2, 1);
      tr2.fillRect(5, 10, 2, 2);
      tr2.fillStyle = '#333';
      tr2.fillRect(3, 11, 2, 2);
      tr2.fillRect(5, 12, 2, 2);
      tr2Canvas.refresh();
    }

    // --- Clapping person frames (10x14) ---
    const clap1Canvas = this.textures.createCanvas('person-clap1', 10, 14);
    const cl1 = clap1Canvas.context;
    cl1.fillStyle = '#c49a6c';
    cl1.fillRect(3, 0, 4, 4);
    cl1.fillStyle = '#222';
    cl1.fillRect(4, 1, 1, 1);
    cl1.fillRect(6, 1, 1, 1);
    cl1.fillStyle = '#c44';
    cl1.fillRect(4, 3, 3, 1);
    cl1.fillStyle = '#888';
    cl1.fillRect(3, 4, 4, 5);
    cl1.fillStyle = '#c49a6c';
    // Hands apart
    cl1.fillRect(1, 4, 2, 1);
    cl1.fillRect(7, 4, 2, 1);
    cl1.fillStyle = '#888';
    cl1.fillRect(3, 9, 2, 3);
    cl1.fillRect(5, 9, 2, 3);
    cl1.fillStyle = '#333';
    cl1.fillRect(3, 12, 2, 2);
    cl1.fillRect(5, 12, 2, 2);
    clap1Canvas.refresh();

    const clap2Canvas = this.textures.createCanvas('person-clap2', 10, 14);
    const cl2 = clap2Canvas.context;
    cl2.fillStyle = '#c49a6c';
    cl2.fillRect(3, 0, 4, 4);
    cl2.fillStyle = '#222';
    cl2.fillRect(4, 1, 1, 1);
    cl2.fillRect(6, 1, 1, 1);
    cl2.fillStyle = '#c44';
    cl2.fillRect(4, 3, 3, 1);
    cl2.fillStyle = '#888';
    cl2.fillRect(3, 4, 4, 5);
    cl2.fillStyle = '#c49a6c';
    // Hands together (clap!)
    cl2.fillRect(4, 4, 2, 1);
    cl2.fillStyle = '#888';
    cl2.fillRect(3, 9, 2, 3);
    cl2.fillRect(5, 9, 2, 3);
    cl2.fillStyle = '#333';
    cl2.fillRect(3, 12, 2, 2);
    cl2.fillRect(5, 12, 2, 2);
    clap2Canvas.refresh();

    // --- Ghost (10x14, translucent floaty person) ---
    const ghostCanvas = this.textures.createCanvas('ghost', 10, 14);
    const gh = ghostCanvas.context;
    gh.fillStyle = '#ffffff';
    // Head (round)
    gh.fillRect(3, 0, 4, 4);
    gh.fillRect(2, 1, 6, 2);
    // Eyes (happy closed)
    gh.fillStyle = '#6688cc';
    gh.fillRect(3, 1, 1, 1);
    gh.fillRect(6, 1, 1, 1);
    // Smile
    gh.fillRect(4, 3, 2, 1);
    // Body (wispy)
    gh.fillStyle = '#ffffff';
    gh.fillRect(2, 4, 6, 6);
    gh.fillRect(3, 3, 4, 1);
    // Wavy bottom
    gh.fillRect(2, 10, 2, 2);
    gh.fillRect(6, 10, 2, 2);
    gh.fillRect(4, 11, 2, 1);
    // Halo
    gh.fillStyle = '#ffee66';
    gh.fillRect(4, -1, 2, 1);
    gh.fillRect(3, -1, 1, 1);
    gh.fillRect(6, -1, 1, 1);
    ghostCanvas.refresh();

    // --- Little guy (10x14, side view walking) frame 1 ---
    const guy1Canvas = this.textures.createCanvas('guy1', 10, 14);
    const g1 = guy1Canvas.context;
    // Head
    g1.fillStyle = '#ffcc88';
    g1.fillRect(3, 0, 4, 4);
    // Hair
    g1.fillStyle = '#553300';
    g1.fillRect(3, 0, 4, 1);
    // Eyes
    g1.fillStyle = '#222';
    g1.fillRect(4, 1, 1, 1);
    g1.fillRect(6, 1, 1, 1);
    // Smile
    g1.fillStyle = '#c44';
    g1.fillRect(4, 3, 1, 1);
    g1.fillRect(5, 3, 1, 1);
    g1.fillRect(6, 3, 1, 1);
    // Body (overalls)
    g1.fillStyle = '#3366cc';
    g1.fillRect(3, 4, 4, 5);
    // Arms
    g1.fillStyle = '#ffcc88';
    g1.fillRect(2, 5, 1, 3);
    g1.fillRect(7, 5, 1, 3);
    // Belt
    g1.fillStyle = '#cc8833';
    g1.fillRect(3, 6, 4, 1);
    // Legs walk pose 1
    g1.fillStyle = '#3366cc';
    g1.fillRect(3, 9, 2, 3);
    g1.fillRect(6, 9, 2, 2);
    // Boots
    g1.fillStyle = '#442200';
    g1.fillRect(3, 12, 2, 2);
    g1.fillRect(6, 11, 2, 2);
    guy1Canvas.refresh();

    // --- Little guy frame 2 ---
    const guy2Canvas = this.textures.createCanvas('guy2', 10, 14);
    const g2 = guy2Canvas.context;
    // Head
    g2.fillStyle = '#ffcc88';
    g2.fillRect(3, 0, 4, 4);
    g2.fillStyle = '#553300';
    g2.fillRect(3, 0, 4, 1);
    g2.fillStyle = '#222';
    g2.fillRect(4, 1, 1, 1);
    g2.fillRect(6, 1, 1, 1);
    g2.fillStyle = '#c44';
    g2.fillRect(4, 3, 1, 1);
    g2.fillRect(5, 3, 1, 1);
    g2.fillRect(6, 3, 1, 1);
    // Body
    g2.fillStyle = '#3366cc';
    g2.fillRect(3, 4, 4, 5);
    g2.fillStyle = '#ffcc88';
    g2.fillRect(2, 5, 1, 3);
    g2.fillRect(7, 5, 1, 3);
    g2.fillStyle = '#cc8833';
    g2.fillRect(3, 6, 4, 1);
    // Legs walk pose 2 (swapped)
    g2.fillStyle = '#3366cc';
    g2.fillRect(3, 9, 2, 2);
    g2.fillRect(6, 9, 2, 3);
    // Boots
    g2.fillStyle = '#442200';
    g2.fillRect(3, 11, 2, 2);
    g2.fillRect(6, 12, 2, 2);
    guy2Canvas.refresh();

    // --- Hangar (top-down, 48x48) ---
    const hangarCanvas = this.textures.createCanvas('hangar', 48, 48);
    const hgc = hangarCanvas.context;
    // Roof (corrugated metal, top-down)
    hgc.fillStyle = '#707070';
    hgc.fillRect(0, 0, 48, 48);
    // Corrugated ridges
    hgc.fillStyle = '#808080';
    for (let ry = 0; ry < 48; ry += 4) {
      hgc.fillRect(0, ry, 48, 2);
    }
    // Roof edge/lip
    hgc.fillStyle = '#555';
    hgc.fillRect(0, 0, 48, 1);
    hgc.fillRect(0, 47, 48, 1);
    hgc.fillRect(0, 0, 1, 48);
    hgc.fillRect(47, 0, 1, 48);
    // Open door (left side, facing runway)
    hgc.fillStyle = '#1a1a1a';
    hgc.fillRect(0, 14, 4, 20);
    // Door frame
    hgc.fillStyle = '#606060';
    hgc.fillRect(0, 12, 4, 2);
    hgc.fillRect(0, 34, 4, 2);
    // Shadow inside door
    hgc.fillStyle = '#111';
    hgc.fillRect(1, 16, 2, 16);
    // Vent on roof
    hgc.fillStyle = '#666';
    hgc.fillRect(36, 20, 6, 8);
    hgc.fillStyle = '#555';
    hgc.fillRect(37, 21, 4, 6);
    hangarCanvas.refresh();

    // --- Taxiway tile (16x16) ---
    const taxiCanvas = this.textures.createCanvas('taxiway', 16, 16);
    const twc = taxiCanvas.context;
    twc.fillStyle = '#555';
    twc.fillRect(0, 0, 16, 16);
    // Center line (yellow dashes)
    twc.fillStyle = '#cc0';
    twc.fillRect(7, 2, 2, 5);
    twc.fillRect(7, 10, 2, 5);
    // Edge markings
    twc.fillStyle = '#666';
    twc.fillRect(0, 0, 1, 16);
    twc.fillRect(15, 0, 1, 16);
    taxiCanvas.refresh();

    // --- Runway (32x128 tile, drawn vertically) ---
    const rwCanvas = this.textures.createCanvas('runway', 32, 128);
    const rwc = rwCanvas.context;
    // Asphalt
    rwc.fillStyle = '#444';
    rwc.fillRect(0, 0, 32, 128);
    // Edge lines
    rwc.fillStyle = '#fff';
    rwc.fillRect(1, 0, 1, 128);
    rwc.fillRect(30, 0, 1, 128);
    // Center dashes
    rwc.fillStyle = '#ff0';
    for (let dy = 4; dy < 128; dy += 16) {
      rwc.fillRect(15, dy, 2, 8);
    }
    // Threshold marks at top and bottom
    rwc.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      rwc.fillRect(5 + i * 6, 2, 3, 10);
      rwc.fillRect(5 + i * 6, 116, 3, 10);
    }
    rwCanvas.refresh();

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

    // =============================================
    // FARM BIOME TEXTURES
    // =============================================

    // --- Grass tile (16x16) ---
    const grassCanvas = this.textures.createCanvas('grass', 16, 16);
    const grc = grassCanvas.context;
    grc.fillStyle = '#5a8a2a';
    grc.fillRect(0, 0, 16, 16);
    const grng = new Phaser.Math.RandomDataGenerator(['grass']);
    for (let i = 0; i < 15; i++) {
      grc.fillStyle = grng.pick(['#4a7a1a', '#6a9a3a', '#5a8a2a', '#3a6a0a']);
      grc.fillRect(grng.between(0, 15), grng.between(0, 15), 1, 1);
    }
    grassCanvas.refresh();

    // --- Crop rows (16x16, 4 variants) ---
    const cropCanvas = this.textures.createCanvas('crop-tiles', 64, 16);
    const crc = cropCanvas.context;
    const cropColors = [
      ['#8a7a2a', '#9a8a3a'], // wheat
      ['#3a8a2a', '#2a7a1a'], // green crop
      ['#7a9a3a', '#6a8a2a'], // light crop
      ['#6a5a1a', '#7a6a2a'], // harvested/dirt
    ];
    for (let t = 0; t < 4; t++) {
      // Dirt base
      crc.fillStyle = '#8a6a3a';
      crc.fillRect(t * 16, 0, 16, 16);
      // Crop rows
      for (let row = 0; row < 16; row += 4) {
        crc.fillStyle = cropColors[t][0];
        crc.fillRect(t * 16, row, 16, 2);
        crc.fillStyle = cropColors[t][1];
        crc.fillRect(t * 16 + 2, row, 12, 1);
      }
    }
    cropCanvas.refresh();
    for (let i = 0; i < 4; i++) {
      this.textures.get('crop-tiles').add(i, 0, i * 16, 0, 16, 16);
    }

    // --- Barn (top-down, 24x32) ---
    const barnCanvas = this.textures.createCanvas('barn', 24, 32);
    const bnc = barnCanvas.context;
    bnc.fillStyle = '#8b2a1a';
    bnc.fillRect(0, 0, 24, 32);
    // Roof ridge
    bnc.fillStyle = '#6a1a0a';
    bnc.fillRect(11, 0, 2, 32);
    // Door
    bnc.fillStyle = '#3a1a0a';
    bnc.fillRect(8, 0, 8, 4);
    // Roof edge
    bnc.fillStyle = '#5a1a0a';
    bnc.fillRect(0, 0, 24, 1);
    bnc.fillRect(0, 31, 24, 1);
    bnc.fillRect(0, 0, 1, 32);
    bnc.fillRect(23, 0, 1, 32);
    // Cross beams
    bnc.fillStyle = '#7a2a1a';
    bnc.fillRect(0, 10, 24, 1);
    bnc.fillRect(0, 21, 24, 1);
    barnCanvas.refresh();

    // --- Silo (top-down, 10x10 circle) ---
    const siloCanvas = this.textures.createCanvas('silo', 10, 10);
    const slc = siloCanvas.context;
    slc.fillStyle = '#aaa';
    // Circle
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if ((x - 4.5) * (x - 4.5) + (y - 4.5) * (y - 4.5) <= 20) {
          slc.fillRect(x, y, 1, 1);
        }
      }
    }
    // Highlight
    slc.fillStyle = '#ccc';
    slc.fillRect(3, 2, 2, 2);
    // Roof cap
    slc.fillStyle = '#888';
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if ((x - 4.5) * (x - 4.5) + (y - 4.5) * (y - 4.5) <= 8) {
          slc.fillRect(x, y, 1, 1);
        }
      }
    }
    siloCanvas.refresh();

    // --- Fence horizontal (16x4) ---
    const fenceHCanvas = this.textures.createCanvas('fence-h', 16, 4);
    const fhc = fenceHCanvas.context;
    fhc.fillStyle = '#8a6a3a';
    fhc.fillRect(0, 1, 16, 2);
    fhc.fillStyle = '#6a4a2a';
    fhc.fillRect(0, 0, 1, 4);
    fhc.fillRect(5, 0, 1, 4);
    fhc.fillRect(10, 0, 1, 4);
    fhc.fillRect(15, 0, 1, 4);
    fenceHCanvas.refresh();

    // --- Fence vertical (4x16) ---
    const fenceVCanvas = this.textures.createCanvas('fence-v', 4, 16);
    const fvc = fenceVCanvas.context;
    fvc.fillStyle = '#8a6a3a';
    fvc.fillRect(1, 0, 2, 16);
    fvc.fillStyle = '#6a4a2a';
    fvc.fillRect(0, 0, 4, 1);
    fvc.fillRect(0, 5, 4, 1);
    fvc.fillRect(0, 10, 4, 1);
    fvc.fillRect(0, 15, 4, 1);
    fenceVCanvas.refresh();

    // --- Hay bale (top-down, 8x6) ---
    const hayCanvas = this.textures.createCanvas('hay', 8, 6);
    const hyc = hayCanvas.context;
    hyc.fillStyle = '#ccaa44';
    hyc.fillRect(1, 0, 6, 6);
    hyc.fillRect(0, 1, 8, 4);
    hyc.fillStyle = '#ddbb55';
    hyc.fillRect(2, 1, 4, 4);
    hyc.fillStyle = '#bbaa33';
    hyc.fillRect(3, 0, 2, 1);
    hyc.fillRect(3, 5, 2, 1);
    // Straw lines
    hyc.fillStyle = '#aa8822';
    hyc.fillRect(1, 2, 6, 1);
    hyc.fillRect(1, 4, 6, 1);
    hayCanvas.refresh();

    // --- Small hut (top-down, 12x12) ---
    const hutCanvas = this.textures.createCanvas('hut', 12, 12);
    const htc = hutCanvas.context;
    // Mud walls
    htc.fillStyle = '#aa8855';
    htc.fillRect(1, 1, 10, 10);
    // Roof (thatch)
    htc.fillStyle = '#ccaa44';
    htc.fillRect(0, 0, 12, 12);
    htc.fillStyle = '#bbaa33';
    htc.fillRect(2, 2, 8, 8);
    // Roof peak
    htc.fillStyle = '#ddbb55';
    htc.fillRect(4, 4, 4, 4);
    // Door
    htc.fillStyle = '#5a3a1a';
    htc.fillRect(5, 9, 2, 3);
    // Edge
    htc.fillStyle = '#998844';
    htc.fillRect(0, 0, 12, 1);
    htc.fillRect(0, 11, 12, 1);
    htc.fillRect(0, 0, 1, 12);
    htc.fillRect(11, 0, 1, 12);
    hutCanvas.refresh();

    // --- Corral (top-down fence rectangle, 32x24) ---
    const corralCanvas = this.textures.createCanvas('corral', 32, 24);
    const crlc = corralCanvas.context;
    // Dirt floor
    crlc.fillStyle = '#9a7a50';
    crlc.fillRect(2, 2, 28, 20);
    // Fence posts and rails
    crlc.fillStyle = '#8a6a3a';
    crlc.fillRect(0, 0, 32, 2);
    crlc.fillRect(0, 22, 32, 2);
    crlc.fillRect(0, 0, 2, 24);
    crlc.fillRect(30, 0, 2, 10);
    crlc.fillRect(30, 18, 2, 6);
    // Posts
    crlc.fillStyle = '#6a4a2a';
    crlc.fillRect(0, 0, 2, 2);
    crlc.fillRect(10, 0, 2, 2);
    crlc.fillRect(20, 0, 2, 2);
    crlc.fillRect(30, 0, 2, 2);
    crlc.fillRect(0, 22, 2, 2);
    crlc.fillRect(10, 22, 2, 2);
    crlc.fillRect(20, 22, 2, 2);
    crlc.fillRect(30, 22, 2, 2);
    crlc.fillRect(0, 11, 2, 2);
    crlc.fillRect(30, 8, 2, 2);
    crlc.fillRect(30, 18, 2, 2);
    corralCanvas.refresh();

    // =============================================
    // ANIMAL TEXTURES
    // =============================================

    // --- Pig (side view, 12x10) ---
    const pigCanvas = this.textures.createCanvas('pig', 12, 10);
    const pic = pigCanvas.context;
    // Body (round, fat)
    pic.fillStyle = '#ffaaaa';
    pic.fillRect(3, 3, 6, 4);
    pic.fillRect(2, 4, 8, 2);
    // Belly highlight
    pic.fillStyle = '#ffcccc';
    pic.fillRect(4, 5, 4, 1);
    // Head
    pic.fillStyle = '#ffbbbb';
    pic.fillRect(9, 2, 3, 4);
    pic.fillRect(10, 1, 2, 5);
    // Snout
    pic.fillStyle = '#ff8888';
    pic.fillRect(11, 3, 1, 2);
    // Nostril
    pic.fillStyle = '#dd6666';
    pic.fillRect(11, 3, 1, 1);
    // Eye
    pic.fillStyle = '#222';
    pic.fillRect(10, 2, 1, 1);
    // Ear
    pic.fillStyle = '#ff9999';
    pic.fillRect(9, 1, 2, 1);
    // Legs (short, stubby)
    pic.fillStyle = '#dd8888';
    pic.fillRect(3, 7, 2, 3);
    pic.fillRect(7, 7, 2, 3);
    // Hooves
    pic.fillStyle = '#aa6666';
    pic.fillRect(3, 9, 2, 1);
    pic.fillRect(7, 9, 2, 1);
    // Curly tail
    pic.fillStyle = '#ff9999';
    pic.fillRect(1, 3, 1, 1);
    pic.fillRect(0, 2, 1, 1);
    pic.fillRect(1, 1, 1, 1);
    pigCanvas.refresh();

    // --- Pig frame 2 (alternate leg positions) ---
    const pig2Canvas = this.textures.createCanvas('pig2', 12, 10);
    const pic2 = pig2Canvas.context;
    pic2.drawImage(pigCanvas.canvas, 0, 0);
    // Erase original legs and hooves
    pic2.clearRect(3, 7, 2, 3);
    pic2.clearRect(7, 7, 2, 3);
    // Draw legs in alternate positions (shifted)
    pic2.fillStyle = '#dd8888';
    pic2.fillRect(4, 7, 2, 3);
    pic2.fillRect(6, 7, 2, 3);
    // Hooves
    pic2.fillStyle = '#aa6666';
    pic2.fillRect(4, 9, 2, 1);
    pic2.fillRect(6, 9, 2, 1);
    pig2Canvas.refresh();

    // --- Camel (side view, 16x14) ---
    const camelCanvas = this.textures.createCanvas('camel', 16, 14);
    const cmc = camelCanvas.context;
    // Body
    cmc.fillStyle = '#c49a6c';
    cmc.fillRect(4, 4, 8, 5);
    cmc.fillRect(3, 5, 10, 3);
    // Hump
    cmc.fillStyle = '#b88a5c';
    cmc.fillRect(6, 2, 4, 3);
    cmc.fillRect(7, 1, 2, 2);
    // Neck (long, angled)
    cmc.fillStyle = '#d4aa7c';
    cmc.fillRect(12, 2, 2, 6);
    cmc.fillRect(13, 1, 2, 3);
    // Head
    cmc.fillStyle = '#d4aa7c';
    cmc.fillRect(13, 0, 3, 3);
    cmc.fillRect(14, 0, 2, 2);
    // Mouth
    cmc.fillStyle = '#c49a6c';
    cmc.fillRect(15, 2, 1, 1);
    // Eye
    cmc.fillStyle = '#222';
    cmc.fillRect(14, 0, 1, 1);
    // Ear
    cmc.fillStyle = '#b88a5c';
    cmc.fillRect(13, 0, 1, 1);
    // Legs (long, thin)
    cmc.fillStyle = '#aa7a4c';
    cmc.fillRect(4, 9, 2, 5);
    cmc.fillRect(10, 9, 2, 5);
    // Knees
    cmc.fillStyle = '#997a4c';
    cmc.fillRect(4, 11, 2, 1);
    cmc.fillRect(10, 11, 2, 1);
    // Hooves
    cmc.fillStyle = '#665533';
    cmc.fillRect(4, 13, 2, 1);
    cmc.fillRect(10, 13, 2, 1);
    // Tail
    cmc.fillStyle = '#aa7a4c';
    cmc.fillRect(3, 5, 1, 3);
    cmc.fillRect(2, 4, 1, 2);
    camelCanvas.refresh();

    // --- Camel frame 2 (alternate leg positions) ---
    const camel2Canvas = this.textures.createCanvas('camel2', 16, 14);
    const cmc2 = camel2Canvas.context;
    cmc2.drawImage(camelCanvas.canvas, 0, 0);
    // Erase original legs, knees, hooves
    cmc2.clearRect(4, 9, 2, 5);
    cmc2.clearRect(10, 9, 2, 5);
    // Draw legs in alternate positions (shifted inward)
    cmc2.fillStyle = '#aa7a4c';
    cmc2.fillRect(5, 9, 2, 5);
    cmc2.fillRect(9, 9, 2, 5);
    // Knees
    cmc2.fillStyle = '#997a4c';
    cmc2.fillRect(5, 11, 2, 1);
    cmc2.fillRect(9, 11, 2, 1);
    // Hooves
    cmc2.fillStyle = '#665533';
    cmc2.fillRect(5, 13, 2, 1);
    cmc2.fillRect(9, 13, 2, 1);
    camel2Canvas.refresh();

    // --- Chicken (side view, 8x8) ---
    const chickenCanvas = this.textures.createCanvas('chicken', 8, 8);
    const chkc = chickenCanvas.context;
    // Body
    chkc.fillStyle = '#fff';
    chkc.fillRect(2, 3, 4, 3);
    chkc.fillRect(1, 4, 5, 2);
    // Wing
    chkc.fillStyle = '#eee';
    chkc.fillRect(2, 3, 3, 2);
    // Head
    chkc.fillStyle = '#fff';
    chkc.fillRect(5, 1, 2, 3);
    // Comb
    chkc.fillStyle = '#ff3333';
    chkc.fillRect(5, 0, 2, 1);
    chkc.fillRect(6, 0, 1, 2);
    // Wattle
    chkc.fillStyle = '#ff4444';
    chkc.fillRect(6, 3, 1, 1);
    // Beak
    chkc.fillStyle = '#ffaa00';
    chkc.fillRect(7, 2, 1, 1);
    // Eye
    chkc.fillStyle = '#222';
    chkc.fillRect(6, 1, 1, 1);
    // Legs (thin)
    chkc.fillStyle = '#dd8800';
    chkc.fillRect(2, 6, 1, 2);
    chkc.fillRect(4, 6, 1, 2);
    // Feet
    chkc.fillRect(1, 7, 2, 1);
    chkc.fillRect(4, 7, 2, 1);
    // Tail feathers
    chkc.fillStyle = '#ddd';
    chkc.fillRect(0, 2, 2, 2);
    chkc.fillRect(0, 1, 1, 2);
    chickenCanvas.refresh();

    // --- Chicken frame 2 (alternate leg positions) ---
    const chk2Canvas = this.textures.createCanvas('chicken2', 8, 8);
    const chkc2 = chk2Canvas.context;
    chkc2.drawImage(chickenCanvas.canvas, 0, 0);
    // Erase original legs and feet
    chkc2.clearRect(1, 6, 2, 2);
    chkc2.clearRect(4, 6, 2, 2);
    // Draw legs in alternate positions (shifted)
    chkc2.fillStyle = '#dd8800';
    chkc2.fillRect(3, 6, 1, 2);
    chkc2.fillRect(5, 6, 1, 2);
    // Feet
    chkc2.fillRect(2, 7, 2, 1);
    chkc2.fillRect(5, 7, 2, 1);
    chk2Canvas.refresh();

    // --- Goat (side view, 12x10) ---
    const goatCanvas = this.textures.createCanvas('goat', 12, 10);
    const gtc = goatCanvas.context;
    // Body
    gtc.fillStyle = '#ddd';
    gtc.fillRect(3, 3, 6, 4);
    gtc.fillRect(2, 4, 8, 2);
    // Fur detail
    gtc.fillStyle = '#ccc';
    gtc.fillRect(4, 3, 3, 1);
    // Head
    gtc.fillStyle = '#ddd';
    gtc.fillRect(9, 1, 3, 4);
    gtc.fillRect(10, 0, 2, 5);
    // Horns
    gtc.fillStyle = '#aa8855';
    gtc.fillRect(10, 0, 1, 1);
    gtc.fillRect(9, 0, 1, 1);
    gtc.fillRect(9, -1, 1, 1);
    // Ear
    gtc.fillStyle = '#ccc';
    gtc.fillRect(9, 1, 1, 1);
    // Eye
    gtc.fillStyle = '#222';
    gtc.fillRect(10, 2, 1, 1);
    // Mouth
    gtc.fillStyle = '#bbb';
    gtc.fillRect(11, 4, 1, 1);
    // Beard
    gtc.fillStyle = '#aaa';
    gtc.fillRect(10, 5, 1, 1);
    gtc.fillRect(11, 5, 1, 1);
    // Legs
    gtc.fillStyle = '#999';
    gtc.fillRect(3, 7, 1, 3);
    gtc.fillRect(5, 7, 1, 3);
    gtc.fillRect(7, 7, 1, 3);
    gtc.fillRect(8, 7, 1, 3);
    // Hooves
    gtc.fillStyle = '#666';
    gtc.fillRect(3, 9, 1, 1);
    gtc.fillRect(5, 9, 1, 1);
    gtc.fillRect(7, 9, 1, 1);
    gtc.fillRect(8, 9, 1, 1);
    // Tail
    gtc.fillStyle = '#ccc';
    gtc.fillRect(2, 3, 1, 2);
    gtc.fillRect(1, 2, 1, 2);
    goatCanvas.refresh();

    // --- Goat frame 2 (alternate leg positions) ---
    const goat2Canvas = this.textures.createCanvas('goat2', 12, 10);
    const gtc2 = goat2Canvas.context;
    gtc2.drawImage(goatCanvas.canvas, 0, 0);
    // Erase original legs and hooves
    gtc2.clearRect(3, 7, 1, 3);
    gtc2.clearRect(5, 7, 1, 3);
    gtc2.clearRect(7, 7, 1, 3);
    gtc2.clearRect(8, 7, 1, 3);
    // Draw legs in alternate positions (shifted)
    gtc2.fillStyle = '#999';
    gtc2.fillRect(4, 7, 1, 3);
    gtc2.fillRect(5, 7, 1, 3);
    gtc2.fillRect(7, 7, 1, 3);
    gtc2.fillRect(9, 7, 1, 3);
    // Hooves
    gtc2.fillStyle = '#666';
    gtc2.fillRect(4, 9, 1, 1);
    gtc2.fillRect(5, 9, 1, 1);
    gtc2.fillRect(7, 9, 1, 1);
    gtc2.fillRect(9, 9, 1, 1);
    goat2Canvas.refresh();

    // --- Market stall (top-down, 16x12) ---
    const stallCanvas = this.textures.createCanvas('stall', 16, 12);
    const stlc = stallCanvas.context;
    stlc.fillStyle = '#8a6a3a';
    stlc.fillRect(0, 4, 16, 6);
    stlc.fillStyle = '#7a5a2a';
    stlc.fillRect(0, 4, 16, 1);
    stlc.fillStyle = '#cc4444';
    stlc.fillRect(0, 0, 16, 5);
    stlc.fillStyle = '#dd5555';
    stlc.fillRect(0, 0, 4, 5);
    stlc.fillRect(8, 0, 4, 5);
    stlc.fillStyle = '#bb3333';
    stlc.fillRect(0, 4, 16, 1);
    stlc.fillStyle = '#ffcc44';
    stlc.fillRect(2, 6, 3, 2);
    stlc.fillStyle = '#88cc44';
    stlc.fillRect(7, 5, 2, 3);
    stlc.fillStyle = '#ff8844';
    stlc.fillRect(11, 6, 3, 2);
    stallCanvas.refresh();

    // --- Market stall variant (blue) ---
    const stall2Canvas = this.textures.createCanvas('stall2', 16, 12);
    const stl2c = stall2Canvas.context;
    stl2c.fillStyle = '#8a6a3a';
    stl2c.fillRect(0, 4, 16, 6);
    stl2c.fillStyle = '#7a5a2a';
    stl2c.fillRect(0, 4, 16, 1);
    stl2c.fillStyle = '#3366aa';
    stl2c.fillRect(0, 0, 16, 5);
    stl2c.fillStyle = '#4477bb';
    stl2c.fillRect(0, 0, 4, 5);
    stl2c.fillRect(8, 0, 4, 5);
    stl2c.fillStyle = '#225599';
    stl2c.fillRect(0, 4, 16, 1);
    stl2c.fillStyle = '#cc8855';
    stl2c.fillRect(2, 5, 2, 3);
    stl2c.fillRect(5, 6, 2, 2);
    stl2c.fillStyle = '#cc44aa';
    stl2c.fillRect(9, 5, 4, 3);
    stall2Canvas.refresh();

    // --- Market stall variant (green) ---
    const stall3Canvas = this.textures.createCanvas('stall3', 16, 12);
    const stl3c = stall3Canvas.context;
    stl3c.fillStyle = '#8a6a3a';
    stl3c.fillRect(0, 4, 16, 6);
    stl3c.fillStyle = '#7a5a2a';
    stl3c.fillRect(0, 4, 16, 1);
    stl3c.fillStyle = '#338844';
    stl3c.fillRect(0, 0, 16, 5);
    stl3c.fillStyle = '#449955';
    stl3c.fillRect(0, 0, 4, 5);
    stl3c.fillRect(8, 0, 4, 5);
    stl3c.fillStyle = '#227733';
    stl3c.fillRect(0, 4, 16, 1);
    stl3c.fillStyle = '#ff6644';
    stl3c.fillRect(3, 6, 2, 2);
    stl3c.fillStyle = '#ffaa33';
    stl3c.fillRect(7, 5, 3, 3);
    stl3c.fillStyle = '#44cc88';
    stl3c.fillRect(12, 6, 2, 2);
    stall3Canvas.refresh();

    // --- Market tent (top-down, 20x16) ---
    const tentCanvas = this.textures.createCanvas('tent', 20, 16);
    const tnc = tentCanvas.context;
    tnc.fillStyle = '#ddcc88';
    tnc.fillRect(2, 2, 16, 12);
    tnc.fillRect(0, 4, 20, 8);
    tnc.fillStyle = '#ccbb77';
    tnc.fillRect(0, 7, 20, 2);
    tnc.fillStyle = '#8a6a3a';
    tnc.fillRect(1, 3, 1, 1);
    tnc.fillRect(18, 3, 1, 1);
    tnc.fillRect(1, 12, 1, 1);
    tnc.fillRect(18, 12, 1, 1);
    tnc.fillStyle = '#2a2a1a';
    tnc.fillRect(8, 12, 4, 4);
    tnc.fillStyle = '#aa9966';
    tnc.fillRect(0, 2, 20, 1);
    tnc.fillRect(0, 13, 20, 1);
    tentCanvas.refresh();

    // --- Carried goods (small items, 4x4 each) ---
    const goodsTypes = ['goods-basket', 'goods-jug', 'goods-cloth', 'goods-fruit', 'goods-bread'];

    const bktC = this.textures.createCanvas('goods-basket', 4, 4);
    const bkt = bktC.context;
    bkt.fillStyle = '#aa8844';
    bkt.fillRect(0, 1, 4, 3);
    bkt.fillStyle = '#88aa33';
    bkt.fillRect(1, 0, 2, 2);
    bkt.fillStyle = '#ccaa55';
    bkt.fillRect(1, 2, 2, 1);
    bktC.refresh();

    const jugC = this.textures.createCanvas('goods-jug', 4, 4);
    const jg = jugC.context;
    jg.fillStyle = '#cc8855';
    jg.fillRect(1, 1, 2, 3);
    jg.fillRect(0, 2, 4, 1);
    jg.fillStyle = '#ddaa77';
    jg.fillRect(1, 0, 2, 1);
    jugC.refresh();

    const clbC = this.textures.createCanvas('goods-cloth', 4, 4);
    const clb = clbC.context;
    clb.fillStyle = '#cc44aa';
    clb.fillRect(0, 0, 4, 4);
    clb.fillStyle = '#dd66bb';
    clb.fillRect(1, 1, 2, 2);
    clbC.refresh();

    const frtC = this.textures.createCanvas('goods-fruit', 4, 4);
    const frt = frtC.context;
    frt.fillStyle = '#ffaa33';
    frt.fillRect(0, 1, 2, 2);
    frt.fillStyle = '#ff4444';
    frt.fillRect(2, 0, 2, 2);
    frt.fillStyle = '#88cc33';
    frt.fillRect(1, 2, 2, 2);
    frtC.refresh();

    const brdC = this.textures.createCanvas('goods-bread', 4, 4);
    const brd = brdC.context;
    brd.fillStyle = '#cc9944';
    brd.fillRect(0, 1, 4, 2);
    brd.fillStyle = '#ddaa55';
    brd.fillRect(1, 0, 2, 3);
    brdC.refresh();

    // --- Meat chunk (6x5) ---
    const meatCanvas = this.textures.createCanvas('meat', 6, 5);
    const mtc = meatCanvas.context;
    mtc.fillStyle = '#cc3333';
    mtc.fillRect(1, 0, 4, 4);
    mtc.fillRect(0, 1, 6, 3);
    mtc.fillStyle = '#ff6666';
    mtc.fillRect(2, 1, 2, 2);
    mtc.fillStyle = '#eee';
    mtc.fillRect(1, 3, 1, 2);
    mtc.fillRect(4, 3, 1, 2);
    meatCanvas.refresh();

    // =============================================
    // TOWN BIOME TEXTURES
    // =============================================

    // --- Dirt road tile (16x16, straight vertical) ---
    const roadVCanvas = this.textures.createCanvas('road-v', 16, 16);
    const rvc = roadVCanvas.context;
    rvc.fillStyle = '#9a7a50';
    rvc.fillRect(0, 0, 16, 16);
    // Ruts/tracks
    rvc.fillStyle = '#8a6a40';
    rvc.fillRect(4, 0, 2, 16);
    rvc.fillRect(10, 0, 2, 16);
    // Edge dirt
    rvc.fillStyle = '#aa8a60';
    rvc.fillRect(0, 0, 1, 16);
    rvc.fillRect(15, 0, 1, 16);
    // Noise
    const drvRng = new Phaser.Math.RandomDataGenerator(['drv']);
    for (let i = 0; i < 8; i++) {
      rvc.fillStyle = drvRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
      rvc.fillRect(drvRng.between(0, 15), drvRng.between(0, 15), 1, 1);
    }
    roadVCanvas.refresh();

    // --- Dirt road tile (16x16, straight horizontal) ---
    const roadHCanvas = this.textures.createCanvas('road-h', 16, 16);
    const rhc = roadHCanvas.context;
    rhc.fillStyle = '#9a7a50';
    rhc.fillRect(0, 0, 16, 16);
    // Ruts
    rhc.fillStyle = '#8a6a40';
    rhc.fillRect(0, 4, 16, 2);
    rhc.fillRect(0, 10, 16, 2);
    // Edge
    rhc.fillStyle = '#aa8a60';
    rhc.fillRect(0, 0, 16, 1);
    rhc.fillRect(0, 15, 16, 1);
    const drhRng = new Phaser.Math.RandomDataGenerator(['drh']);
    for (let i = 0; i < 8; i++) {
      rhc.fillStyle = drhRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
      rhc.fillRect(drhRng.between(0, 15), drhRng.between(0, 15), 1, 1);
    }
    roadHCanvas.refresh();

    // --- Dirt road intersection (16x16) ---
    const roadXCanvas = this.textures.createCanvas('road-x', 16, 16);
    const rxc = roadXCanvas.context;
    rxc.fillStyle = '#9a7a50';
    rxc.fillRect(0, 0, 16, 16);
    rxc.fillStyle = '#8a6a40';
    // Cross ruts
    rxc.fillRect(4, 0, 2, 16);
    rxc.fillRect(10, 0, 2, 16);
    rxc.fillRect(0, 4, 16, 2);
    rxc.fillRect(0, 10, 16, 2);
    const drxRng = new Phaser.Math.RandomDataGenerator(['drx']);
    for (let i = 0; i < 10; i++) {
      rxc.fillStyle = drxRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
      rxc.fillRect(drxRng.between(0, 15), drxRng.between(0, 15), 1, 1);
    }
    roadXCanvas.refresh();

    // --- Small house (top-down, 16x16) ---
    const houseCanvas = this.textures.createCanvas('house', 16, 16);
    const hoc = houseCanvas.context;
    // Roof
    hoc.fillStyle = '#8a3a2a';
    hoc.fillRect(1, 1, 14, 14);
    // Ridge
    hoc.fillStyle = '#6a2a1a';
    hoc.fillRect(1, 7, 14, 2);
    // Walls visible
    hoc.fillStyle = '#ddc';
    hoc.fillRect(2, 2, 12, 5);
    hoc.fillRect(2, 9, 12, 5);
    // Door
    hoc.fillStyle = '#5a3a1a';
    hoc.fillRect(7, 12, 3, 3);
    // Windows
    hoc.fillStyle = '#8af';
    hoc.fillRect(3, 3, 2, 2);
    hoc.fillRect(11, 3, 2, 2);
    houseCanvas.refresh();

    // --- Large building (top-down, 32x24) ---
    const bldgCanvas = this.textures.createCanvas('building', 32, 24);
    const blc = bldgCanvas.context;
    blc.fillStyle = '#778';
    blc.fillRect(0, 0, 32, 24);
    // Flat roof edge
    blc.fillStyle = '#556';
    blc.fillRect(0, 0, 32, 1);
    blc.fillRect(0, 23, 32, 1);
    blc.fillRect(0, 0, 1, 24);
    blc.fillRect(31, 0, 1, 24);
    // AC units on roof
    blc.fillStyle = '#666';
    blc.fillRect(3, 3, 4, 4);
    blc.fillRect(25, 3, 4, 4);
    blc.fillStyle = '#555';
    blc.fillRect(4, 4, 2, 2);
    blc.fillRect(26, 4, 2, 2);
    // Windows (rows)
    blc.fillStyle = '#acd';
    for (let wy = 10; wy < 22; wy += 4) {
      for (let wx = 3; wx < 30; wx += 5) {
        blc.fillRect(wx, wy, 3, 2);
      }
    }
    bldgCanvas.refresh();

    // --- Hospital (top-down, 32x32) ---
    const hospCanvas = this.textures.createCanvas('hospital', 32, 32);
    const hsc = hospCanvas.context;
    // Main building
    hsc.fillStyle = '#eee';
    hsc.fillRect(0, 0, 32, 32);
    // Edge
    hsc.fillStyle = '#ccc';
    hsc.fillRect(0, 0, 32, 1);
    hsc.fillRect(0, 31, 32, 1);
    hsc.fillRect(0, 0, 1, 32);
    hsc.fillRect(31, 0, 1, 32);
    // Red cross on roof
    hsc.fillStyle = '#cc0000';
    hsc.fillRect(13, 8, 6, 16);
    hsc.fillRect(8, 13, 16, 6);
    // Helipad circle
    hsc.fillStyle = '#ddd';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if ((x - 15.5) * (x - 15.5) + (y - 15.5) * (y - 15.5) > 144 &&
            (x - 15.5) * (x - 15.5) + (y - 15.5) * (y - 15.5) < 169) {
          hsc.fillRect(x, y, 1, 1);
        }
      }
    }
    // Entrance
    hsc.fillStyle = '#88aacc';
    hsc.fillRect(12, 28, 8, 4);
    // Windows
    hsc.fillStyle = '#aaccee';
    for (let wx = 3; wx < 30; wx += 5) {
      hsc.fillRect(wx, 2, 3, 2);
      hsc.fillRect(wx, 28, 3, 2);
    }
    for (let wy = 3; wy < 30; wy += 5) {
      hsc.fillRect(1, wy, 2, 3);
      hsc.fillRect(29, wy, 2, 3);
    }
    hospCanvas.refresh();

    // --- Park/green area tile (16x16) ---
    const parkCanvas = this.textures.createCanvas('park', 16, 16);
    const pkc = parkCanvas.context;
    pkc.fillStyle = '#4a9a2a';
    pkc.fillRect(0, 0, 16, 16);
    // Trees (small circles)
    pkc.fillStyle = '#2a6a0a';
    pkc.fillRect(3, 3, 3, 3);
    pkc.fillRect(10, 10, 3, 3);
    pkc.fillStyle = '#3a7a1a';
    pkc.fillRect(4, 4, 1, 1);
    pkc.fillRect(11, 11, 1, 1);
    // Path
    pkc.fillStyle = '#bba';
    pkc.fillRect(7, 0, 2, 16);
    parkCanvas.refresh();

    // --- Parking lot tile (16x16) ---
    const parkingCanvas = this.textures.createCanvas('parking', 16, 16);
    const plc = parkingCanvas.context;
    plc.fillStyle = '#4a4a4a';
    plc.fillRect(0, 0, 16, 16);
    // Parking lines
    plc.fillStyle = '#fff';
    plc.fillRect(0, 0, 1, 8);
    plc.fillRect(5, 0, 1, 8);
    plc.fillRect(10, 0, 1, 8);
    plc.fillRect(15, 0, 1, 8);
    parkingCanvas.refresh();

    // --- Shop (top-down, 16x20) ---
    const shopCanvas = this.textures.createCanvas('shop', 16, 20);
    const shc = shopCanvas.context;
    shc.fillStyle = '#cc8844';
    shc.fillRect(0, 0, 16, 20);
    shc.fillStyle = '#aa6633';
    shc.fillRect(0, 0, 16, 1);
    shc.fillRect(0, 19, 16, 1);
    shc.fillRect(0, 0, 1, 20);
    shc.fillRect(15, 0, 1, 20);
    // Awning
    shc.fillStyle = '#dd4444';
    shc.fillRect(1, 16, 14, 3);
    shc.fillStyle = '#bb3333';
    shc.fillRect(1, 17, 14, 1);
    // Door
    shc.fillStyle = '#5a3a1a';
    shc.fillRect(6, 17, 4, 3);
    // Windows
    shc.fillStyle = '#8af';
    shc.fillRect(2, 3, 4, 3);
    shc.fillRect(10, 3, 4, 3);
    shopCanvas.refresh();

    // --- Apartment (top-down, 24x32) ---
    const aptCanvas = this.textures.createCanvas('apartment', 24, 32);
    const apc = aptCanvas.context;
    apc.fillStyle = '#887766';
    apc.fillRect(0, 0, 24, 32);
    // Edge
    apc.fillStyle = '#665544';
    apc.fillRect(0, 0, 24, 1);
    apc.fillRect(0, 31, 24, 1);
    apc.fillRect(0, 0, 1, 32);
    apc.fillRect(23, 0, 1, 32);
    // Windows grid
    apc.fillStyle = '#aaccdd';
    for (let wy = 3; wy < 30; wy += 5) {
      for (let wx = 3; wx < 22; wx += 6) {
        apc.fillRect(wx, wy, 3, 3);
      }
    }
    // Roof AC
    apc.fillStyle = '#555';
    apc.fillRect(10, 2, 4, 3);
    aptCanvas.refresh();

    // --- Church (top-down, 16x24) ---
    const churchCanvas = this.textures.createCanvas('church', 16, 24);
    const chc = churchCanvas.context;
    chc.fillStyle = '#ddd';
    chc.fillRect(2, 4, 12, 20);
    // Steeple
    chc.fillStyle = '#ccc';
    chc.fillRect(5, 0, 6, 6);
    chc.fillStyle = '#999';
    chc.fillRect(7, 0, 2, 2);
    // Cross on top
    chc.fillStyle = '#aa8833';
    chc.fillRect(7, 0, 2, 1);
    chc.fillRect(6, 1, 4, 1);
    // Door
    chc.fillStyle = '#5a2a0a';
    chc.fillRect(6, 20, 4, 4);
    // Windows
    chc.fillStyle = '#88aaff';
    chc.fillRect(3, 8, 2, 4);
    chc.fillRect(11, 8, 2, 4);
    chc.fillRect(3, 15, 2, 4);
    chc.fillRect(11, 15, 2, 4);
    // Stained glass
    chc.fillStyle = '#ff8844';
    chc.fillRect(7, 8, 2, 2);
    churchCanvas.refresh();

    // --- Gas station (top-down, 20x16) ---
    const gasCanvas = this.textures.createCanvas('gas-station', 20, 16);
    const gsc = gasCanvas.context;
    // Canopy
    gsc.fillStyle = '#ddd';
    gsc.fillRect(0, 0, 14, 16);
    gsc.fillStyle = '#bbb';
    gsc.fillRect(0, 0, 14, 1);
    gsc.fillRect(0, 15, 14, 1);
    // Canopy posts
    gsc.fillStyle = '#888';
    gsc.fillRect(1, 1, 1, 14);
    gsc.fillRect(12, 1, 1, 14);
    // Pumps
    gsc.fillStyle = '#cc3333';
    gsc.fillRect(4, 4, 2, 3);
    gsc.fillRect(8, 4, 2, 3);
    gsc.fillRect(4, 9, 2, 3);
    gsc.fillRect(8, 9, 2, 3);
    // Store
    gsc.fillStyle = '#996633';
    gsc.fillRect(14, 2, 6, 12);
    gsc.fillStyle = '#8af';
    gsc.fillRect(15, 4, 4, 3);
    gasCanvas.refresh();

    // --- Building damage cracks overlay (16x16) ---
    const crackCanvas = this.textures.createCanvas('cracks', 16, 16);
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
    const fireCanvas = this.textures.createCanvas('fire', 8, 8);
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
    const smokeCanvas = this.textures.createCanvas('smoke', 8, 8);
    const skc = smokeCanvas.context;
    skc.fillStyle = '#666';
    skc.fillRect(2, 2, 4, 4);
    skc.fillRect(1, 3, 6, 2);
    skc.fillRect(3, 1, 2, 1);
    skc.fillStyle = '#888';
    skc.fillRect(3, 3, 2, 2);
    smokeCanvas.refresh();

    // --- Rubble (16x16) ---
    const rubbleCanvas = this.textures.createCanvas('rubble', 16, 16);
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
}
