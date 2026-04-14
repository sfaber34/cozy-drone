// Top-down tractor sprite (facing north at angle=0) and a simple wheat-stalk
// for pickers to "carry". Field tiles reuse the existing `crop-tiles` frames
// generated in propTextures.js.
export function generateFarmFieldTextures(scene) {
  // --- Tractor (top-down, 14x18, pointing up at angle=0) ---
  const tractorC = scene.textures.createCanvas("tractor", 14, 18);
  const c = tractorC.context;

  // Rear wheels (wide, at the back of the tractor = bottom of sprite)
  c.fillStyle = "#222";
  c.fillRect(0, 12, 3, 5);
  c.fillRect(11, 12, 3, 5);
  c.fillStyle = "#555";
  c.fillRect(0, 14, 3, 1);
  c.fillRect(11, 14, 3, 1);

  // Front wheels (smaller, at the front)
  c.fillStyle = "#222";
  c.fillRect(1, 2, 2, 3);
  c.fillRect(11, 2, 2, 3);

  // Chassis / body (green)
  c.fillStyle = "#2a7a2a";
  c.fillRect(3, 3, 8, 13);
  c.fillStyle = "#357a35";
  c.fillRect(3, 3, 8, 1);
  c.fillStyle = "#1a5a1a";
  c.fillRect(3, 15, 8, 1);

  // Hood (front — with grille detail)
  c.fillStyle = "#1f5a1f";
  c.fillRect(4, 4, 6, 3);
  c.fillStyle = "#111";
  c.fillRect(5, 4, 4, 1); // grille slats
  c.fillRect(5, 6, 4, 1);

  // Exhaust smokestack
  c.fillStyle = "#555";
  c.fillRect(6, 1, 2, 3);
  c.fillStyle = "#333";
  c.fillRect(6, 1, 1, 3);

  // Cab / driver well (dark slot where the person sits)
  c.fillStyle = "#1a3a1a";
  c.fillRect(4, 8, 6, 5);

  // Headlights
  c.fillStyle = "#ffee88";
  c.fillRect(3, 3, 1, 1);
  c.fillRect(10, 3, 1, 1);

  tractorC.refresh();

  // --- Basket (tiny prop carried by pickers, 6x5) ---
  const basketC = scene.textures.createCanvas("picker-basket", 6, 5);
  const b = basketC.context;
  b.fillStyle = "#6a3a1a"; // rim
  b.fillRect(0, 1, 6, 1);
  b.fillStyle = "#8a5a2a"; // weave body
  b.fillRect(1, 2, 4, 2);
  b.fillStyle = "#6a3a1a"; // bottom shadow
  b.fillRect(1, 4, 4, 1);
  // Weave lines
  b.fillStyle = "#5a2a12";
  b.fillRect(2, 2, 1, 1);
  b.fillRect(4, 2, 1, 1);
  b.fillRect(1, 3, 1, 1);
  b.fillRect(3, 3, 1, 1);
  // Peek of wheat sticking out
  b.fillStyle = "#d9c062";
  b.fillRect(2, 0, 1, 2);
  b.fillRect(4, 0, 1, 2);
  basketC.refresh();

  // --- Wheat stalk (tiny prop held by pickers, 3x5) ---
  const stalkC = scene.textures.createCanvas("wheat-stalk", 3, 5);
  const s = stalkC.context;
  s.fillStyle = "#7a6a2a"; // stem
  s.fillRect(1, 2, 1, 3);
  s.fillStyle = "#d9c062"; // grain head
  s.fillRect(0, 0, 3, 2);
  s.fillStyle = "#a98f3a";
  s.fillRect(0, 1, 3, 1);
  stalkC.refresh();
}
