import Phaser from 'phaser';

export function generatePropTextures(scene) {
  // --- Desert tiles (16x16 each, 4 variants — very subtle variation to avoid grid pattern) ---
  const tileCanvas = scene.textures.createCanvas('desert-tiles', 64, 16);
  const dtc = tileCanvas.context;
  const baseSand = '#d2b48c';
  for (let t = 0; t < 4; t++) {
    // All tiles share the same base color
    dtc.fillStyle = baseSand;
    dtc.fillRect(t * 16, 0, 16, 16);
    // Very subtle noise pixels — close to base color so tiles blend seamlessly
    const rng = new Phaser.Math.RandomDataGenerator([`tile${t}`]);
    for (let i = 0; i < 8; i++) {
      const shade = rng.pick(['#d0b088', '#d4b490', '#cead85', '#d6b892']);
      dtc.fillStyle = shade;
      dtc.fillRect(t * 16 + rng.between(0, 15), rng.between(0, 15), 1, 1);
    }
  }
  tileCanvas.refresh();
  for (let i = 0; i < 4; i++) {
    scene.textures.get('desert-tiles').add(i, 0, i * 16, 0, 16, 16);
  }

  // --- Rock (8x8) ---
  const rockCanvas = scene.textures.createCanvas('rock', 8, 8);
  const rkc = rockCanvas.context;
  rkc.fillStyle = '#8a7a6a';
  rkc.fillRect(2, 1, 4, 6);
  rkc.fillRect(1, 2, 6, 4);
  rkc.fillStyle = '#9a8a7a';
  rkc.fillRect(3, 2, 2, 3);
  rockCanvas.refresh();

  // --- Scrub brush (8x8) ---
  const brushCanvas = scene.textures.createCanvas('brush', 8, 8);
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

  // --- Rock2 (10x8) larger dark brown rock ---
  const rock2Canvas = scene.textures.createCanvas('rock2', 10, 8);
  const rk2 = rock2Canvas.context;
  rk2.fillStyle = '#5a4a3a';
  rk2.fillRect(2, 2, 6, 5);
  rk2.fillRect(1, 3, 8, 3);
  rk2.fillStyle = '#6a5a4a';
  rk2.fillRect(3, 3, 4, 2);
  rk2.fillStyle = '#4a3a2a';
  rk2.fillRect(2, 5, 5, 1);
  rock2Canvas.refresh();

  // --- Rock3 (6x6) small reddish rock ---
  const rock3Canvas = scene.textures.createCanvas('rock3', 6, 6);
  const rk3 = rock3Canvas.context;
  rk3.fillStyle = '#8a5a4a';
  rk3.fillRect(1, 1, 4, 4);
  rk3.fillRect(2, 0, 2, 1);
  rk3.fillStyle = '#9a6a5a';
  rk3.fillRect(2, 2, 2, 2);
  rock3Canvas.refresh();

  // --- Rock4 (12x6) flat wide sandstone rock ---
  const rock4Canvas = scene.textures.createCanvas('rock4', 12, 6);
  const rk4 = rock4Canvas.context;
  rk4.fillStyle = '#b0a080';
  rk4.fillRect(1, 2, 10, 3);
  rk4.fillRect(2, 1, 8, 1);
  rk4.fillStyle = '#c0b090';
  rk4.fillRect(3, 2, 6, 2);
  rk4.fillStyle = '#9a8a6a';
  rk4.fillRect(2, 4, 8, 1);
  rock4Canvas.refresh();

  // --- Bush2 (10x8) wider scrub bush, darker green ---
  const bush2Canvas = scene.textures.createCanvas('bush2', 10, 8);
  const b2 = bush2Canvas.context;
  b2.fillStyle = '#3a6a2a';
  b2.fillRect(2, 3, 6, 4);
  b2.fillRect(1, 4, 8, 2);
  b2.fillStyle = '#2a5a1a';
  b2.fillRect(3, 2, 4, 1);
  b2.fillRect(4, 5, 2, 2);
  b2.fillStyle = '#4a7a3a';
  b2.fillRect(3, 4, 2, 1);
  bush2Canvas.refresh();

  // --- Bush3 (6x8) tall thin dead bush, brown ---
  const bush3Canvas = scene.textures.createCanvas('bush3', 6, 8);
  const b3 = bush3Canvas.context;
  b3.fillStyle = '#7a6a4a';
  b3.fillRect(2, 2, 2, 6);
  b3.fillStyle = '#6a5a3a';
  b3.fillRect(0, 1, 2, 1);
  b3.fillRect(4, 0, 2, 1);
  b3.fillRect(1, 1, 1, 2);
  b3.fillRect(4, 0, 1, 3);
  bush3Canvas.refresh();

  // --- Tumbleweed (7x7) round brown tumbleweed ---
  const twCanvas = scene.textures.createCanvas('tumbleweed', 7, 7);
  const tw = twCanvas.context;
  tw.fillStyle = '#8a7a50';
  tw.fillRect(2, 1, 3, 5);
  tw.fillRect(1, 2, 5, 3);
  tw.fillStyle = '#7a6a40';
  tw.fillRect(3, 2, 1, 3);
  tw.fillRect(2, 3, 3, 1);
  tw.fillStyle = '#9a8a60';
  tw.fillRect(2, 2, 1, 1);
  tw.fillRect(4, 4, 1, 1);
  twCanvas.refresh();

  // --- Cactus (6x12) tall green cactus with arms ---
  const cactusCanvas = scene.textures.createCanvas('cactus', 6, 12);
  const cc = cactusCanvas.context;
  cc.fillStyle = '#3a7a3a';
  cc.fillRect(2, 1, 2, 10);
  cc.fillStyle = '#2a6a2a';
  cc.fillRect(0, 4, 2, 2);
  cc.fillRect(4, 3, 2, 2);
  cc.fillRect(0, 3, 1, 1);
  cc.fillRect(5, 2, 1, 1);
  cc.fillStyle = '#4a8a4a';
  cc.fillRect(2, 2, 1, 3);
  cactusCanvas.refresh();

  // --- Skull (6x5) small animal skull, white/bone ---
  const skullCanvas = scene.textures.createCanvas('skull', 6, 5);
  const sk = skullCanvas.context;
  sk.fillStyle = '#e8e0d0';
  sk.fillRect(1, 0, 4, 4);
  sk.fillRect(0, 1, 6, 2);
  sk.fillStyle = '#2a2a2a';
  sk.fillRect(1, 1, 1, 1);
  sk.fillRect(4, 1, 1, 1);
  sk.fillStyle = '#d0c8b8';
  sk.fillRect(2, 3, 2, 2);
  skullCanvas.refresh();

  // --- Bones (8x4) scattered bones ---
  const bonesCanvas = scene.textures.createCanvas('bones', 8, 4);
  const bn = bonesCanvas.context;
  bn.fillStyle = '#d8d0c0';
  bn.fillRect(0, 1, 3, 1);
  bn.fillRect(5, 2, 3, 1);
  bn.fillRect(2, 0, 1, 1);
  bn.fillRect(6, 1, 1, 1);
  bn.fillStyle = '#c8c0b0';
  bn.fillRect(3, 2, 2, 1);
  bn.fillRect(1, 3, 1, 1);
  bonesCanvas.refresh();

  // --- Pottery (5x6) broken clay pot ---
  const potCanvas = scene.textures.createCanvas('pottery', 5, 6);
  const pt = potCanvas.context;
  pt.fillStyle = '#b07040';
  pt.fillRect(1, 1, 3, 4);
  pt.fillRect(0, 2, 5, 2);
  pt.fillStyle = '#c08050';
  pt.fillRect(2, 1, 1, 3);
  pt.fillStyle = '#905a30';
  pt.fillRect(1, 4, 3, 1);
  potCanvas.refresh();

  // --- Dead tree (8x14) dead trunk, bare branches ---
  const dtCanvas = scene.textures.createCanvas('deadtree', 8, 14);
  const dt = dtCanvas.context;
  dt.fillStyle = '#5a4a3a';
  dt.fillRect(3, 4, 2, 10);
  dt.fillStyle = '#6a5a4a';
  dt.fillRect(1, 2, 2, 2);
  dt.fillRect(5, 1, 2, 2);
  dt.fillRect(2, 3, 1, 2);
  dt.fillRect(5, 2, 1, 3);
  dt.fillStyle = '#4a3a2a';
  dt.fillRect(0, 1, 1, 1);
  dt.fillRect(7, 0, 1, 1);
  dt.fillRect(3, 12, 2, 2);
  dtCanvas.refresh();

  // --- Palm stump (6x6) cut palm tree stump ---
  const psCanvas = scene.textures.createCanvas('palmstump', 6, 6);
  const ps = psCanvas.context;
  ps.fillStyle = '#7a6a4a';
  ps.fillRect(1, 1, 4, 4);
  ps.fillRect(2, 0, 2, 1);
  ps.fillStyle = '#8a7a5a';
  ps.fillRect(2, 1, 2, 2);
  ps.fillStyle = '#6a5a3a';
  ps.fillRect(1, 4, 4, 2);
  psCanvas.refresh();

  // --- Grass tile (16x16) ---
  const grassCanvas = scene.textures.createCanvas('grass', 16, 16);
  const grc = grassCanvas.context;
  grc.fillStyle = '#5a8a2a';
  grc.fillRect(0, 0, 16, 16);
  const grng = new Phaser.Math.RandomDataGenerator(['grass']);
  for (let i = 0; i < 15; i++) {
    grc.fillStyle = grng.pick(['#4a7a1a', '#6a9a3a', '#5a8a2a', '#3a6a0a']);
    grc.fillRect(grng.between(0, 15), grng.between(0, 15), 1, 1);
  }
  grassCanvas.refresh();

  // --- Crop rows (16x16, 4 variants, vertical rows of little plants) ---
  //
  // Each 16×16 tile is designed to tile seamlessly in BOTH dimensions, so
  // when rendered via a TileSprite the seams between tiles are invisible:
  //
  //   - 4 vertical plant rows per tile at x = 1, 5, 9, 13 → repeats every
  //     4 px, which wraps cleanly across the tile boundary (13 → next 1).
  //   - 4 leaf clusters per row vertically at y = 1, 5, 9, 13 → same deal.
  //
  // Each plant is a 3×2 leaf-cluster with a 1-pixel stem running the full
  // height of the row, giving the "rows of little plants" look.
  const cropCanvas = scene.textures.createCanvas('crop-tiles', 64, 16);
  const crc = cropCanvas.context;
  const variants = [
    // dirt       , stem/body  , leaf light , leaf shadow
    ['#8a6a3a', '#7a8a2a', '#b8c844', '#5a6a18'], // wheat (golden-green)
    ['#8a6a3a', '#2a7a2a', '#6ac84a', '#1a4a1a'], // vibrant green
    ['#8a6a3a', '#4a7a1a', '#8aaa3a', '#2a4a0a'], // mature dark green
    ['#9a7a4a', '#6a7a2a', '#8a9a3a', '#3a4a12'], // sparser / light crop
  ];
  const plantCols = [1, 5, 9, 13];
  const plantRows = [1, 5, 9, 13];
  for (let t = 0; t < 4; t++) {
    const [dirt, stem, leafL, leafD] = variants[t];
    // Dirt base
    crc.fillStyle = dirt;
    crc.fillRect(t * 16, 0, 16, 16);
    // Subtle dirt speckle (between rows)
    crc.fillStyle = t === 3 ? '#8a6a3a' : '#7a5a2a';
    crc.fillRect(t * 16 + 3, 3, 1, 1);
    crc.fillRect(t * 16 + 11, 7, 1, 1);
    crc.fillRect(t * 16 + 7, 11, 1, 1);
    crc.fillRect(t * 16 + 3, 14, 1, 1);

    for (const cx of plantCols) {
      // Continuous stem down the center of each plant row
      crc.fillStyle = stem;
      crc.fillRect(t * 16 + cx, 0, 1, 16);
      // Leaf clusters at intervals down the row (3 wide × 2 tall)
      for (const cy of plantRows) {
        // Dark shadow underneath (gives depth)
        crc.fillStyle = leafD;
        crc.fillRect(t * 16 + cx - 1, cy + 1, 3, 1);
        // Bright leaves
        crc.fillStyle = leafL;
        crc.fillRect(t * 16 + cx - 1, cy, 3, 1);
        crc.fillRect(t * 16 + cx,     cy, 1, 1);
      }
    }
  }
  cropCanvas.refresh();
  for (let i = 0; i < 4; i++) {
    scene.textures.get('crop-tiles').add(i, 0, i * 16, 0, 16, 16);
  }
}
