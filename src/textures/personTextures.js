import Phaser from 'phaser';

export const NUM_SKINS = 200;

// NOTE: avoid values too close to the desert background (#d2b48c = 210,180,140).
// '#dbb08a' was nearly identical to sand and made arms invisible; replaced
// with a pinker/cooler fair tone that contrasts.
export const skinTones = ['#d4a574', '#c49a6c', '#b8885c', '#e8a898', '#c8946a', '#a07850'];

// The full generation (skins + one-off characters) is expensive — 200 skin
// variants x ~11 poses + a dozen other sprites. Call paths:
//   generatePersonTextures(scene)                         — do everything
//   generatePersonTextures(scene, { skinIndexEnd: 0 })    — characters only
//   generatePersonTextures(scene, {                       — one chunk
//     skinIndexStart: n, skinIndexEnd: n+25, includeCharacters: false })
// See generateIntroPersonTextures + generatePersonSkinsAsync below.
export function generatePersonTextures(scene, opts = {}) {
  const skinIndexStart = opts.skinIndexStart ?? 0;
  const skinIndexEnd = opts.skinIndexEnd ?? NUM_SKINS;
  const includeCharacters = opts.includeCharacters ?? true;
  const headTypes = ['keffiyeh', 'keffiyeh', 'kufi', 'kufi', 'hijab', 'hijab'];
  const headColors = [
    '#fff', '#eee', '#ddd', '#cc3333', '#aa2222', '#dd8833', '#cc9944',
    '#557744', '#882222', '#884488', '#4466aa', '#44aaaa', '#ddaa44',
    '#e8dcc8', '#cc66aa', '#88cc88', '#aaccee', '#ffcc88', '#dd6644',
    '#ffcc44', '#88bb88', '#cc88cc', '#eedd88',
  ];
  const robeColors = [
    '#f0ece0', '#e8dcc8', '#4477aa', '#3a3a3a', '#5a7a4a', '#2a2a2a',
    '#2a3a5a', '#c8b088', '#6a2a2a', '#cc8844', '#888', '#446688',
    '#996633', '#2a4a2a', '#cc4444', '#4488cc', '#44aa44', '#ddaa33',
    '#887766', '#665544', '#aa8866', '#7a6a5a', '#bbaa88', '#d8c8a8',
    '#555', '#4a2a4a', '#1a3a3a', '#5a2a3a', '#224422', '#442244',
    '#553322', '#1a2a3a', '#8844aa', '#556644', '#2a2a4a', '#3a2a1a',
  ];
  const shoeColors = ['#8a6a3a', '#5a3a1a', '#333', '#222', '#4a3a1a', '#6a4a2a', '#3a3a2a', '#2a2a2a', '#6a5a3a'];
  const accentColors = [
    '#aa2222', '#222', '#335588', '#111', '#3a5a2a', '#bb6622',
    '#5a1a1a', '#bbb', '#cc3333', '#aa7722', '#661111', '#333',
    '#aa6633', '#666', '#775522', '#ddd', '#eee', '#776644',
  ];

  // Generate unique combos with seeded randomness for consistency
  const skinRng = new Phaser.Math.RandomDataGenerator(['skins']);
  const personSkins = [];
  for (let i = 0; i < NUM_SKINS; i++) {
    const headType = skinRng.pick(headTypes);
    const accent = skinRng.pick(accentColors);
    personSkins.push({
      skin: skinRng.pick(skinTones),
      robe: skinRng.pick(robeColors),
      head: skinRng.pick(headColors),
      headType,
      shoes: skinRng.pick(shoeColors),
      accent,
    });
  }

  const drawPersonHead = (ctx, s, yOff) => {
    // Head
    ctx.fillStyle = s.skin;
    ctx.fillRect(3, yOff, 4, 4);
    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(4, yOff + 1, 1, 1);
    ctx.fillRect(6, yOff + 1, 1, 1);

    if (s.headType === 'keffiyeh') {
      ctx.fillStyle = s.head;
      ctx.fillRect(3, yOff, 4, 1);
      ctx.fillRect(2, yOff, 1, 3);
      ctx.fillRect(7, yOff, 1, 3);
      ctx.fillStyle = s.accent;
      ctx.fillRect(3, yOff, 4, 1);
    } else if (s.headType === 'kufi') {
      ctx.fillStyle = s.head;
      ctx.fillRect(3, yOff, 4, 1);
      ctx.fillRect(2, yOff, 1, 1);
      ctx.fillRect(7, yOff, 1, 1);
    } else if (s.headType === 'hijab') {
      ctx.fillStyle = s.head;
      ctx.fillRect(2, yOff, 6, 2);
      ctx.fillRect(2, yOff + 2, 1, 2);
      ctx.fillRect(7, yOff + 2, 1, 2);
      ctx.fillRect(3, yOff, 4, 1);
      ctx.fillStyle = '#222';
      ctx.fillRect(4, yOff + 1, 1, 1);
      ctx.fillRect(6, yOff + 1, 1, 1);
    }
  };

  for (let si = skinIndexStart; si < skinIndexEnd && si < personSkins.length; si++) {
    const s = personSkins[si];
    const suffix = si;

    // --- Standing ---
    const standC = scene.textures.createCanvas(`person-stand-${suffix}`, 10, 14);
    const sc = standC.context;
    drawPersonHead(sc, s, 0);
    sc.fillStyle = '#c44';
    sc.fillRect(5, 3, 1, 1);
    sc.fillStyle = s.robe;
    sc.fillRect(3, 4, 4, 6);
    sc.fillStyle = s.skin;
    sc.fillRect(2, 5, 1, 3);
    sc.fillRect(7, 5, 1, 3);
    sc.fillStyle = s.robe;
    sc.fillRect(3, 9, 2, 3);
    sc.fillRect(5, 9, 2, 3);
    sc.fillStyle = s.shoes;
    sc.fillRect(3, 12, 2, 2);
    sc.fillRect(5, 12, 2, 2);
    standC.refresh();

    // --- Wave frame 1 ---
    const wave1C = scene.textures.createCanvas(`person-wave1-${suffix}`, 10, 14);
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
    const wave2C = scene.textures.createCanvas(`person-wave2-${suffix}`, 10, 14);
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
    const run1C = scene.textures.createCanvas(`person-run1-${suffix}`, 10, 14);
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
    const run2C = scene.textures.createCanvas(`person-run2-${suffix}`, 10, 14);
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

    // --- Angry stand (normal eyes, frown) ---
    const angryC = scene.textures.createCanvas(`person-angry-${suffix}`, 10, 14);
    const ac = angryC.context;
    drawPersonHead(ac, s, 0);
    // Frowning mouth — 2px lower corners
    ac.fillStyle = '#7a2222';
    ac.fillRect(4, 3, 3, 1);
    ac.fillStyle = '#441111';
    ac.fillRect(4, 3, 1, 1);
    ac.fillRect(6, 3, 1, 1);
    // Body (same as stand)
    ac.fillStyle = s.robe;
    ac.fillRect(3, 4, 4, 6);
    ac.fillStyle = s.skin;
    ac.fillRect(2, 5, 1, 3);
    ac.fillRect(7, 5, 1, 3);
    ac.fillStyle = s.robe;
    ac.fillRect(3, 9, 2, 3);
    ac.fillRect(5, 9, 2, 3);
    ac.fillStyle = s.shoes;
    ac.fillRect(3, 12, 2, 2);
    ac.fillRect(5, 12, 2, 2);
    angryC.refresh();

    // --- Throw windup (arm cocked back over shoulder, rock in hand) ---
    const throw1C = scene.textures.createCanvas(`person-throw1-${suffix}`, 10, 14);
    const t1 = throw1C.context;
    drawPersonHead(t1, s, 0);
    // Frown mouth
    t1.fillStyle = '#7a2222';
    t1.fillRect(4, 3, 3, 1);
    // Body
    t1.fillStyle = s.robe;
    t1.fillRect(3, 4, 4, 6);
    // Front/planted arm down at left
    t1.fillStyle = s.skin;
    t1.fillRect(2, 5, 1, 3);
    // Throw arm cocked back and high — hand sweeping up-behind over the head
    t1.fillStyle = s.skin;
    t1.fillRect(7, 4, 1, 1); // shoulder
    t1.fillRect(7, 2, 1, 1); // bicep back
    t1.fillRect(8, 1, 1, 1); // forearm behind head
    t1.fillRect(9, 0, 1, 1); // hand
    // Rock in the raised hand
    t1.fillStyle = '#555';
    t1.fillRect(9, 0, 1, 1);
    // Legs + shoes (braced stance, slightly wider)
    t1.fillStyle = s.robe;
    t1.fillRect(3, 9, 2, 3);
    t1.fillRect(5, 9, 2, 3);
    t1.fillStyle = s.shoes;
    t1.fillRect(2, 12, 2, 2);
    t1.fillRect(6, 12, 2, 2);
    throw1C.refresh();

    // --- Angry shake (fist raised, no rock — for idle anger animation) ---
    const shakeC = scene.textures.createCanvas(`person-shake-${suffix}`, 10, 14);
    const sh = shakeC.context;
    drawPersonHead(sh, s, 0);
    sh.fillStyle = '#7a2222';
    sh.fillRect(4, 3, 3, 1);
    sh.fillStyle = s.robe;
    sh.fillRect(3, 4, 4, 6);
    // Resting arm at left
    sh.fillStyle = s.skin;
    sh.fillRect(2, 5, 1, 3);
    // Right arm raised in fist (bent up at the elbow)
    sh.fillStyle = s.skin;
    sh.fillRect(7, 4, 1, 1); // shoulder
    sh.fillRect(8, 3, 1, 1); // bicep
    sh.fillRect(8, 1, 1, 2); // forearm + fist
    // Legs + shoes
    sh.fillStyle = s.robe;
    sh.fillRect(3, 9, 2, 3);
    sh.fillRect(5, 9, 2, 3);
    sh.fillStyle = s.shoes;
    sh.fillRect(3, 12, 2, 2);
    sh.fillRect(5, 12, 2, 2);
    shakeC.refresh();

    // --- Throw release (arm extended forward/high, rock gone) ---
    const throw2C = scene.textures.createCanvas(`person-throw2-${suffix}`, 10, 14);
    const t2 = throw2C.context;
    drawPersonHead(t2, s, 0);
    // Shouting mouth (open)
    t2.fillStyle = '#441111';
    t2.fillRect(4, 3, 3, 1);
    // Body leaning forward (slight shift visible via arm layout)
    t2.fillStyle = s.robe;
    t2.fillRect(3, 4, 4, 6);
    // Back arm pulled in (short)
    t2.fillStyle = s.skin;
    t2.fillRect(2, 5, 1, 2);
    // Throw arm extended forward and up — diagonal from shoulder toward top-right
    t2.fillStyle = s.skin;
    t2.fillRect(7, 4, 1, 1);
    t2.fillRect(8, 3, 1, 1);
    t2.fillRect(9, 2, 1, 1);
    // Legs — front foot planted, back foot pushed off
    t2.fillStyle = s.robe;
    t2.fillRect(3, 9, 2, 3);
    t2.fillRect(5, 9, 2, 3);
    t2.fillStyle = s.shoes;
    t2.fillRect(2, 12, 2, 2);
    t2.fillRect(6, 12, 2, 2);
    throw2C.refresh();
  }

  if (!includeCharacters) return;

  // --- Bride (10x14) ---
  const brideCanvas = scene.textures.createCanvas('bride', 10, 14);
  const brc = brideCanvas.context;
  brc.fillStyle = '#fff';
  brc.fillRect(2, 0, 6, 3);
  brc.fillStyle = '#d4a574';
  brc.fillRect(3, 1, 4, 3);
  brc.fillStyle = '#222';
  brc.fillRect(4, 2, 1, 1);
  brc.fillRect(6, 2, 1, 1);
  brc.fillStyle = '#c44';
  brc.fillRect(4, 3, 3, 1);
  brc.fillStyle = '#fff';
  brc.fillRect(3, 4, 4, 3);
  brc.fillRect(2, 7, 6, 4);
  brc.fillRect(1, 9, 8, 3);
  brc.fillStyle = '#eee';
  brc.fillRect(3, 8, 4, 1);
  brc.fillStyle = '#ff6688';
  brc.fillRect(2, 5, 2, 2);
  brc.fillStyle = '#66cc44';
  brc.fillRect(2, 7, 1, 1);
  brc.fillRect(3, 7, 1, 1);
  brc.fillStyle = '#eeddcc';
  brc.fillRect(3, 12, 2, 2);
  brc.fillRect(5, 12, 2, 2);
  brideCanvas.refresh();

  // --- Groom (10x14) ---
  const groomCanvas = scene.textures.createCanvas('groom', 10, 14);
  const gmc = groomCanvas.context;
  gmc.fillStyle = '#c49a6c';
  gmc.fillRect(3, 0, 4, 4);
  gmc.fillStyle = '#fff';
  gmc.fillRect(3, 0, 4, 1);
  gmc.fillRect(2, 0, 1, 3);
  gmc.fillRect(7, 0, 1, 3);
  gmc.fillStyle = '#cc9933';
  gmc.fillRect(3, 0, 4, 1);
  gmc.fillStyle = '#222';
  gmc.fillRect(4, 1, 1, 1);
  gmc.fillRect(6, 1, 1, 1);
  gmc.fillStyle = '#c44';
  gmc.fillRect(4, 3, 3, 1);
  gmc.fillStyle = '#f0ece0';
  gmc.fillRect(3, 4, 4, 6);
  gmc.fillStyle = '#cc9933';
  gmc.fillRect(3, 4, 1, 6);
  gmc.fillRect(6, 4, 1, 6);
  gmc.fillRect(4, 4, 2, 1);
  gmc.fillStyle = '#c49a6c';
  gmc.fillRect(2, 5, 1, 3);
  gmc.fillRect(7, 5, 1, 3);
  gmc.fillStyle = '#f0ece0';
  gmc.fillRect(3, 9, 2, 3);
  gmc.fillRect(5, 9, 2, 3);
  gmc.fillStyle = '#5a3a1a';
  gmc.fillRect(3, 12, 2, 2);
  gmc.fillRect(5, 12, 2, 2);
  groomCanvas.refresh();

  // --- Priest/Imam (10x14) ---
  const priestCanvas = scene.textures.createCanvas('priest', 10, 14);
  const prc = priestCanvas.context;
  prc.fillStyle = '#c49a6c';
  prc.fillRect(3, 0, 4, 4);
  prc.fillStyle = '#fff';
  prc.fillRect(2, 0, 6, 2);
  prc.fillRect(3, 0, 4, 1);
  prc.fillStyle = '#888';
  prc.fillRect(4, 3, 2, 2);
  prc.fillStyle = '#222';
  prc.fillRect(4, 1, 1, 1);
  prc.fillRect(6, 1, 1, 1);
  prc.fillStyle = '#2a3a2a';
  prc.fillRect(3, 5, 4, 5);
  prc.fillRect(2, 6, 6, 4);
  prc.fillStyle = '#6a4a2a';
  prc.fillRect(1, 6, 2, 2);
  prc.fillStyle = '#f0ece0';
  prc.fillRect(1, 6, 2, 1);
  prc.fillStyle = '#c49a6c';
  prc.fillRect(2, 5, 1, 1);
  prc.fillRect(7, 5, 1, 3);
  prc.fillStyle = '#2a3a2a';
  prc.fillRect(3, 10, 2, 2);
  prc.fillRect(5, 10, 2, 2);
  prc.fillStyle = '#333';
  prc.fillRect(3, 12, 2, 2);
  prc.fillRect(5, 12, 2, 2);
  priestCanvas.refresh();

  // --- Wedding arch (top-down, 20x16) ---
  const archCanvas = scene.textures.createCanvas('wedding-arch', 20, 16);
  const arc = archCanvas.context;
  arc.fillStyle = '#ddd';
  arc.fillRect(0, 2, 2, 14);
  arc.fillRect(18, 2, 2, 14);
  arc.fillStyle = '#eee';
  arc.fillRect(0, 0, 20, 3);
  arc.fillStyle = '#fff';
  arc.fillRect(2, 1, 16, 2);
  arc.fillStyle = '#ff88aa';
  arc.fillRect(3, 0, 2, 2);
  arc.fillRect(8, 0, 2, 2);
  arc.fillRect(15, 0, 2, 2);
  arc.fillStyle = '#ff6688';
  arc.fillRect(5, 1, 2, 1);
  arc.fillRect(11, 1, 2, 1);
  arc.fillStyle = '#4a8a2a';
  arc.fillRect(1, 1, 1, 2);
  arc.fillRect(18, 1, 1, 2);
  archCanvas.refresh();

  // --- Wedding carpet/rug (24x12) ---
  const rugCanvas = scene.textures.createCanvas('wedding-rug', 24, 12);
  const rgc = rugCanvas.context;
  rgc.fillStyle = '#882222';
  rgc.fillRect(0, 0, 24, 12);
  rgc.fillStyle = '#cc9933';
  rgc.fillRect(0, 0, 24, 1);
  rgc.fillRect(0, 11, 24, 1);
  rgc.fillRect(0, 0, 1, 12);
  rgc.fillRect(23, 0, 1, 12);
  rgc.fillStyle = '#aa3333';
  rgc.fillRect(4, 3, 3, 3);
  rgc.fillRect(10, 3, 4, 3);
  rgc.fillRect(17, 3, 3, 3);
  rgc.fillStyle = '#cc9933';
  rgc.fillRect(5, 4, 1, 1);
  rgc.fillRect(12, 4, 1, 1);
  rgc.fillRect(18, 4, 1, 1);
  rgc.fillStyle = '#cc9933';
  for (let fx = 1; fx < 24; fx += 3) {
    rgc.fillRect(fx, 11, 1, 1);
  }
  rugCanvas.refresh();

  // --- Chair/cushion (6x6) ---
  const cushionCanvas = scene.textures.createCanvas('cushion', 6, 6);
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
  const lanternCanvas = scene.textures.createCanvas('lantern', 4, 6);
  const lnc = lanternCanvas.context;
  lnc.fillStyle = '#cc8833';
  lnc.fillRect(1, 0, 2, 1);
  lnc.fillRect(0, 1, 4, 4);
  lnc.fillRect(1, 5, 2, 1);
  lnc.fillStyle = '#ffcc44';
  lnc.fillRect(1, 2, 2, 2);
  lanternCanvas.refresh();

  // --- Clapping person frames (10x14) ---
  const clap1Canvas = scene.textures.createCanvas('person-clap1', 10, 14);
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
  cl1.fillRect(1, 4, 2, 1);
  cl1.fillRect(7, 4, 2, 1);
  cl1.fillStyle = '#888';
  cl1.fillRect(3, 9, 2, 3);
  cl1.fillRect(5, 9, 2, 3);
  cl1.fillStyle = '#333';
  cl1.fillRect(3, 12, 2, 2);
  cl1.fillRect(5, 12, 2, 2);
  clap1Canvas.refresh();

  const clap2Canvas = scene.textures.createCanvas('person-clap2', 10, 14);
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
  cl2.fillRect(4, 4, 2, 1);
  cl2.fillStyle = '#888';
  cl2.fillRect(3, 9, 2, 3);
  cl2.fillRect(5, 9, 2, 3);
  cl2.fillStyle = '#333';
  cl2.fillRect(3, 12, 2, 2);
  cl2.fillRect(5, 12, 2, 2);
  clap2Canvas.refresh();

  // --- Ghost (10x14, translucent floaty person) ---
  const ghostCanvas = scene.textures.createCanvas('ghost', 10, 14);
  const gh = ghostCanvas.context;
  gh.fillStyle = '#ffffff';
  gh.fillRect(3, 0, 4, 4);
  gh.fillRect(2, 1, 6, 2);
  gh.fillStyle = '#6688cc';
  gh.fillRect(3, 1, 1, 1);
  gh.fillRect(6, 1, 1, 1);
  gh.fillRect(4, 3, 2, 1);
  gh.fillStyle = '#ffffff';
  gh.fillRect(2, 4, 6, 6);
  gh.fillRect(3, 3, 4, 1);
  gh.fillRect(2, 10, 2, 2);
  gh.fillRect(6, 10, 2, 2);
  gh.fillRect(4, 11, 2, 1);
  gh.fillStyle = '#ffee66';
  gh.fillRect(4, -1, 2, 1);
  gh.fillRect(3, -1, 1, 1);
  gh.fillRect(6, -1, 1, 1);
  ghostCanvas.refresh();

  // --- Little guy (10x14, side view walking) frame 1 ---
  const guy1Canvas = scene.textures.createCanvas('guy1', 10, 14);
  const g1 = guy1Canvas.context;
  g1.fillStyle = '#ffcc88';
  g1.fillRect(3, 0, 4, 4);
  g1.fillStyle = '#553300';
  g1.fillRect(3, 0, 4, 1);
  g1.fillStyle = '#222';
  g1.fillRect(4, 1, 1, 1);
  g1.fillRect(6, 1, 1, 1);
  g1.fillStyle = '#c44';
  g1.fillRect(4, 3, 1, 1);
  g1.fillRect(5, 3, 1, 1);
  g1.fillRect(6, 3, 1, 1);
  g1.fillStyle = '#3366cc';
  g1.fillRect(3, 4, 4, 5);
  g1.fillStyle = '#ffcc88';
  g1.fillRect(2, 5, 1, 3);
  g1.fillRect(7, 5, 1, 3);
  g1.fillStyle = '#cc8833';
  g1.fillRect(3, 6, 4, 1);
  g1.fillStyle = '#3366cc';
  g1.fillRect(3, 9, 2, 3);
  g1.fillRect(6, 9, 2, 2);
  g1.fillStyle = '#442200';
  g1.fillRect(3, 12, 2, 2);
  g1.fillRect(6, 11, 2, 2);
  guy1Canvas.refresh();

  // --- Little guy frame 2 ---
  const guy2Canvas = scene.textures.createCanvas('guy2', 10, 14);
  const g2 = guy2Canvas.context;
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
  g2.fillStyle = '#3366cc';
  g2.fillRect(3, 4, 4, 5);
  g2.fillStyle = '#ffcc88';
  g2.fillRect(2, 5, 1, 3);
  g2.fillRect(7, 5, 1, 3);
  g2.fillStyle = '#cc8833';
  g2.fillRect(3, 6, 4, 1);
  g2.fillStyle = '#3366cc';
  g2.fillRect(3, 9, 2, 2);
  g2.fillRect(6, 9, 2, 3);
  g2.fillStyle = '#442200';
  g2.fillRect(3, 11, 2, 2);
  g2.fillRect(6, 12, 2, 2);
  guy2Canvas.refresh();

  // --- Little guy cheer pose 1 (both arms raised high) ---
  const guyCheer1Canvas = scene.textures.createCanvas('guy-cheer1', 10, 14);
  const gc1 = guyCheer1Canvas.context;
  gc1.fillStyle = '#ffcc88';
  gc1.fillRect(3, 0, 4, 4);
  gc1.fillStyle = '#553300';
  gc1.fillRect(3, 0, 4, 1);
  gc1.fillStyle = '#222';
  gc1.fillRect(4, 1, 1, 1);
  gc1.fillRect(6, 1, 1, 1);
  gc1.fillStyle = '#c44';
  gc1.fillRect(4, 3, 2, 1); // open-mouth cheer
  gc1.fillStyle = '#3366cc';
  gc1.fillRect(3, 4, 4, 5);
  gc1.fillStyle = '#cc8833';
  gc1.fillRect(3, 6, 4, 1);
  // Both arms up high (skin pixels rising from shoulder to fist)
  gc1.fillStyle = '#ffcc88';
  gc1.fillRect(2, 4, 1, 1); // left shoulder
  gc1.fillRect(1, 2, 1, 2); // left upper arm
  gc1.fillRect(1, 0, 1, 2); // left fist high
  gc1.fillRect(7, 4, 1, 1); // right shoulder
  gc1.fillRect(8, 2, 1, 2); // right upper arm
  gc1.fillRect(8, 0, 1, 2); // right fist high
  // Legs
  gc1.fillStyle = '#3366cc';
  gc1.fillRect(3, 9, 2, 3);
  gc1.fillRect(5, 9, 2, 3);
  gc1.fillStyle = '#442200';
  gc1.fillRect(3, 12, 2, 2);
  gc1.fillRect(5, 12, 2, 2);
  guyCheer1Canvas.refresh();

  // --- Little guy cheer pose 2 (arms slightly lower, jumping apart) ---
  const guyCheer2Canvas = scene.textures.createCanvas('guy-cheer2', 10, 14);
  const gc2 = guyCheer2Canvas.context;
  gc2.fillStyle = '#ffcc88';
  gc2.fillRect(3, 0, 4, 4);
  gc2.fillStyle = '#553300';
  gc2.fillRect(3, 0, 4, 1);
  gc2.fillStyle = '#222';
  gc2.fillRect(4, 1, 1, 1);
  gc2.fillRect(6, 1, 1, 1);
  gc2.fillStyle = '#c44';
  gc2.fillRect(4, 3, 2, 1);
  gc2.fillStyle = '#3366cc';
  gc2.fillRect(3, 4, 4, 5);
  gc2.fillStyle = '#cc8833';
  gc2.fillRect(3, 6, 4, 1);
  // Arms out to the sides (wider V shape)
  gc2.fillStyle = '#ffcc88';
  gc2.fillRect(2, 4, 1, 1); // shoulder L
  gc2.fillRect(1, 3, 1, 2); // upper arm L
  gc2.fillRect(0, 1, 1, 2); // fist L out
  gc2.fillRect(7, 4, 1, 1); // shoulder R
  gc2.fillRect(8, 3, 1, 2); // upper arm R
  gc2.fillRect(9, 1, 1, 2); // fist R out
  // Legs — feet apart (jumping)
  gc2.fillStyle = '#3366cc';
  gc2.fillRect(2, 9, 2, 3);
  gc2.fillRect(6, 9, 2, 3);
  gc2.fillStyle = '#442200';
  gc2.fillRect(2, 12, 2, 2);
  gc2.fillRect(6, 12, 2, 2);
  guyCheer2Canvas.refresh();
}

// Generate ONLY the one-off characters (guy1/guy2/cheer poses, bride,
// groom, priest, arch, carpet, chair, lantern, clap, ghost). Skips the
// expensive 200-skin loop — use this at boot time so the intro cutscene
// can render immediately.
export function generateIntroPersonTextures(scene) {
  generatePersonTextures(scene, { skinIndexStart: 0, skinIndexEnd: 0 });
}

// Generate all 200 person skins in chunks, yielding to the event loop
// between each chunk so the page stays responsive. Calls onDone when
// every skin has been rasterised.
export function generatePersonSkinsAsync(scene, onDone, chunkSize = 20) {
  let i = 0;
  const step = () => {
    const end = Math.min(i + chunkSize, NUM_SKINS);
    generatePersonTextures(scene, {
      skinIndexStart: i,
      skinIndexEnd: end,
      includeCharacters: false,
    });
    i = end;
    if (i >= NUM_SKINS) {
      if (onDone) onDone();
    } else {
      setTimeout(step, 0);
    }
  };
  step();
}
