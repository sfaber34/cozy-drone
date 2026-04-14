// Concert set-piece textures: wooden stage surface + 4 top-down instruments.
export function generateConcertTextures(scene) {
  // --- Stage planks (16x8 tile — used to cover the stage area) ---
  const stageC = scene.textures.createCanvas("stage-plank", 16, 8);
  const sc = stageC.context;
  sc.fillStyle = "#6a4424"; // warm dark wood
  sc.fillRect(0, 0, 16, 8);
  // Plank grain highlights
  sc.fillStyle = "#7a5430";
  sc.fillRect(0, 1, 16, 1);
  sc.fillRect(0, 5, 16, 1);
  // Plank seams
  sc.fillStyle = "#3a2410";
  sc.fillRect(0, 3, 16, 1);
  sc.fillRect(0, 7, 16, 1);
  // Knots
  sc.fillStyle = "#4a2e16";
  sc.fillRect(4, 1, 1, 1);
  sc.fillRect(11, 5, 1, 1);
  stageC.refresh();

  // --- Stage edge (darker front lip, 16x4) ---
  const edgeC = scene.textures.createCanvas("stage-edge", 16, 4);
  const ec = edgeC.context;
  ec.fillStyle = "#2a1a0a";
  ec.fillRect(0, 0, 16, 4);
  ec.fillStyle = "#4a2a16";
  ec.fillRect(0, 0, 16, 1);
  edgeC.refresh();

  // --- Speaker cabinet (small, at stage corners, 8x10) ---
  const spkC = scene.textures.createCanvas("stage-speaker", 8, 10);
  const spc = spkC.context;
  spc.fillStyle = "#1a1a1a";
  spc.fillRect(0, 0, 8, 10);
  spc.fillStyle = "#0a0a0a";
  spc.fillRect(0, 0, 8, 1);
  // Woofer
  spc.fillStyle = "#333";
  spc.fillRect(2, 2, 4, 4);
  spc.fillStyle = "#555";
  spc.fillRect(3, 3, 2, 2);
  // Tweeter
  spc.fillStyle = "#333";
  spc.fillRect(3, 7, 2, 2);
  spkC.refresh();

  // --- Guitar (top-down, 12x5, held across body) ---
  const gtrC = scene.textures.createCanvas("instr-guitar", 12, 5);
  const g = gtrC.context;
  g.fillStyle = "#b26432"; // body wood
  g.fillRect(0, 1, 6, 3);
  g.fillStyle = "#8a4420";
  g.fillRect(0, 0, 6, 1);
  g.fillRect(0, 4, 6, 1);
  g.fillStyle = "#1a1a1a"; // sound hole
  g.fillRect(2, 2, 1, 1);
  // Neck + head
  g.fillStyle = "#3a2a10";
  g.fillRect(6, 2, 5, 1);
  g.fillStyle = "#d0b070";
  g.fillRect(11, 1, 1, 3);
  gtrC.refresh();

  // --- Microphone on stand (top-down, 4x8) ---
  const micC = scene.textures.createCanvas("instr-mic", 4, 8);
  const m = micC.context;
  m.fillStyle = "#222"; // stand post
  m.fillRect(1, 2, 2, 5);
  m.fillStyle = "#555"; // base
  m.fillRect(0, 7, 4, 1);
  // Mic head
  m.fillStyle = "#8a8a8a";
  m.fillRect(0, 0, 4, 2);
  m.fillStyle = "#bbb";
  m.fillRect(1, 0, 2, 1);
  micC.refresh();

  // --- Drum kit (top-down, 14x10) ---
  const drmC = scene.textures.createCanvas("instr-drums", 14, 10);
  const d = drmC.context;
  // Kick/floor tom
  d.fillStyle = "#b03030";
  d.fillRect(3, 3, 8, 6);
  d.fillStyle = "#880000";
  d.fillRect(3, 3, 8, 1);
  d.fillRect(3, 8, 8, 1);
  // Rim
  d.fillStyle = "#cccccc";
  d.fillRect(3, 2, 8, 1);
  // Cymbals (edges)
  d.fillStyle = "#d9c062";
  d.fillRect(0, 1, 3, 3);
  d.fillRect(11, 1, 3, 3);
  d.fillStyle = "#a98f3a";
  d.fillRect(0, 2, 3, 1);
  d.fillRect(11, 2, 3, 1);
  // Snare (front)
  d.fillStyle = "#eeeeee";
  d.fillRect(5, 9, 4, 1);
  drmC.refresh();

  // --- Keyboard (top-down, 14x5) ---
  const kbdC = scene.textures.createCanvas("instr-keyboard", 14, 5);
  const k = kbdC.context;
  k.fillStyle = "#222"; // chassis
  k.fillRect(0, 0, 14, 5);
  k.fillStyle = "#eee"; // white keys strip
  k.fillRect(1, 2, 12, 2);
  // Black keys
  k.fillStyle = "#111";
  k.fillRect(2, 2, 1, 1);
  k.fillRect(4, 2, 1, 1);
  k.fillRect(7, 2, 1, 1);
  k.fillRect(9, 2, 1, 1);
  k.fillRect(11, 2, 1, 1);
  // Seams between white keys (top-down hint)
  k.fillStyle = "#bbb";
  k.fillRect(3, 3, 1, 1);
  k.fillRect(6, 3, 1, 1);
  k.fillRect(8, 3, 1, 1);
  k.fillRect(10, 3, 1, 1);
  k.fillRect(12, 3, 1, 1);
  kbdC.refresh();
}
