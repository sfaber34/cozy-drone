// Tire fire set-piece textures: a single tire, a marshmallow-on-a-stick,
// and a drinking cup. Fire/smoke sprites reuse the existing "fire" and
// "smoke" textures from propTextures.js / effectTextures.js.
export function generateTireFireTextures(scene) {
  // --- Tire (18x12, top-down elliptical ring with hub + tread) ---
  const TW = 18, TH = 12;
  const tireC = scene.textures.createCanvas("tire", TW, TH);
  const tc = tireC.context;
  const cx = TW / 2, cy = TH / 2;
  const rxO = 9, ryO = 6;    // outer ellipse
  const rxI = 3.2, ryI = 2.2; // inner hole
  const rxH = 1.8, ryH = 1.2; // hub
  for (let x = 0; x < TW; x++) {
    for (let y = 0; y < TH; y++) {
      const nx = (x + 0.5 - cx) / rxO;
      const ny = (y + 0.5 - cy) / ryO;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;                // outside tire
      const ix = (x + 0.5 - cx) / rxI;
      const iy = (y + 0.5 - cy) / ryI;
      const i2 = ix * ix + iy * iy;
      const hx = (x + 0.5 - cx) / rxH;
      const hy = (y + 0.5 - cy) / ryH;
      const h2 = hx * hx + hy * hy;
      if (h2 < 1) tc.fillStyle = "#5a5a5a";        // hub / rim
      else if (i2 < 1) tc.fillStyle = "#2a2a2a";   // hole (dark dirt/ash)
      else if (d2 > 0.78) tc.fillStyle = "#060606"; // outer tread shadow
      else tc.fillStyle = "#181818";                // rubber body
      tc.fillRect(x, y, 1, 1);
    }
  }
  // Tread notches on the outer ring for texture
  tc.fillStyle = "#000";
  const treadCount = 10;
  for (let i = 0; i < treadCount; i++) {
    const a = (i / treadCount) * Math.PI * 2;
    const tx = Math.round(cx + Math.cos(a) * (rxO - 0.5));
    const ty = Math.round(cy + Math.sin(a) * (ryO - 0.5));
    tc.fillRect(tx, ty, 1, 1);
  }
  // Subtle top highlight
  tc.fillStyle = "#2a2a2a";
  tc.fillRect(Math.round(cx - 2), Math.round(cy - ryO + 1), 4, 1);
  tireC.refresh();

  // --- Marshmallow on a stick (10x2) ---
  const mmC = scene.textures.createCanvas("marshmallow-stick", 10, 2);
  const mm = mmC.context;
  mm.fillStyle = "#6a4422";      // stick
  mm.fillRect(0, 1, 8, 1);
  mm.fillStyle = "#f6ecd6";      // marshmallow
  mm.fillRect(7, 0, 3, 2);
  mm.fillStyle = "#d0a860";      // toasted edge
  mm.fillRect(9, 0, 1, 2);
  mmC.refresh();

  // --- Hot beverage cup (4x5) ---
  const cupC = scene.textures.createCanvas("hot-cup", 4, 5);
  const cc = cupC.context;
  cc.fillStyle = "#aa3322";      // red cup body
  cc.fillRect(0, 1, 4, 4);
  cc.fillStyle = "#cc4433";      // lighter rim highlight
  cc.fillRect(0, 1, 4, 1);
  cc.fillStyle = "#6a1a10";      // dark bottom
  cc.fillRect(0, 4, 4, 1);
  cc.fillStyle = "#3a2010";      // coffee top
  cc.fillRect(1, 0, 2, 1);
  cupC.refresh();
}
