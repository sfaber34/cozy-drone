// Farm-compound extra textures: clothesline, laundry items, mouse, stick,
// shovel, dirt hole, and food pellet. The basket reuses the existing
// "picker-basket" texture from farmFieldTextures.
export function generateFarmCompoundTextures(scene) {
  // --- Clothesline (32x10, two posts + rope) ---
  const clC = scene.textures.createCanvas("clothesline", 32, 10);
  const c = clC.context;
  // Rope (thin dark line at top)
  c.fillStyle = "#3a2a1a";
  c.fillRect(1, 3, 30, 1);
  // Posts
  c.fillStyle = "#6a4a2a";
  c.fillRect(0, 0, 2, 10);
  c.fillRect(30, 0, 2, 10);
  c.fillStyle = "#8a6a3a"; // highlight
  c.fillRect(0, 0, 1, 10);
  c.fillRect(30, 0, 1, 10);
  c.fillStyle = "#4a2a10"; // base shadow
  c.fillRect(0, 9, 2, 1);
  c.fillRect(30, 9, 2, 1);
  clC.refresh();

  // --- Laundry shirt (6x7) ---
  const shirtC = scene.textures.createCanvas("laundry-shirt", 6, 7);
  const sh = shirtC.context;
  // Tint varies per item via setTint; base drawn white.
  sh.fillStyle = "#ffffff";
  sh.fillRect(1, 1, 4, 5);
  sh.fillRect(0, 2, 6, 2);
  sh.fillStyle = "#cfcfcf"; // neck hole
  sh.fillRect(2, 0, 2, 1);
  sh.fillStyle = "#bbbbbb"; // bottom shadow
  sh.fillRect(1, 5, 4, 1);
  sh.fillStyle = "#aaaaaa"; // cuff shadow
  sh.fillRect(0, 3, 1, 1);
  sh.fillRect(5, 3, 1, 1);
  shirtC.refresh();

  // --- Mouse (5x3, tiny critter with tail) ---
  const mouseC = scene.textures.createCanvas("mouse", 5, 3);
  const m = mouseC.context;
  m.fillStyle = "#7a6a5a"; // body
  m.fillRect(1, 0, 3, 2);
  m.fillStyle = "#555";    // head
  m.fillRect(0, 1, 1, 1);
  m.fillStyle = "#8a7a6a"; // highlight
  m.fillRect(2, 0, 1, 1);
  m.fillStyle = "#3a2a1a"; // tail
  m.fillRect(4, 2, 1, 1);
  m.fillStyle = "#222";    // eye
  m.fillRect(1, 1, 1, 1);
  mouseC.refresh();

  // --- Stick (1x7, held upright — rotation 0 points up when origin=(0.5,1)) ---
  const stickC = scene.textures.createCanvas("farm-stick", 1, 7);
  const st = stickC.context;
  st.fillStyle = "#7a5a2a";
  st.fillRect(0, 0, 1, 7);
  st.fillStyle = "#a87a42"; // lighter tip
  st.fillRect(0, 0, 1, 1);
  stickC.refresh();

  // --- Shovel (3x8, held by hole digger) ---
  const shovelC = scene.textures.createCanvas("farm-shovel", 3, 8);
  const sv = shovelC.context;
  sv.fillStyle = "#7a5a2a"; // wood handle
  sv.fillRect(1, 0, 1, 5);
  sv.fillStyle = "#bbb";    // metal blade
  sv.fillRect(0, 5, 3, 3);
  sv.fillStyle = "#888";    // blade shadow
  sv.fillRect(0, 7, 3, 1);
  shovelC.refresh();

  // --- Dirt hole (10x6, top-down hole in the ground) ---
  const holeC = scene.textures.createCanvas("dirt-hole", 10, 6);
  const dh = holeC.context;
  dh.fillStyle = "#8a6a3a"; // outer mound
  dh.fillRect(0, 1, 10, 4);
  dh.fillRect(1, 0, 8, 6);
  dh.fillStyle = "#5a3a1a"; // mid dirt
  dh.fillRect(1, 1, 8, 4);
  dh.fillRect(2, 0, 6, 6);
  dh.fillStyle = "#2a1a0a"; // dark bottom
  dh.fillRect(2, 2, 6, 2);
  dh.fillRect(3, 1, 4, 4);
  holeC.refresh();

  // --- Food pellet (2x2, tossed to animals) ---
  const pelletC = scene.textures.createCanvas("food-pellet", 2, 2);
  const fp = pelletC.context;
  fp.fillStyle = "#c8a05a";
  fp.fillRect(0, 0, 2, 2);
  fp.fillStyle = "#e8c080";
  fp.fillRect(0, 0, 1, 1);
  pelletC.refresh();
}
