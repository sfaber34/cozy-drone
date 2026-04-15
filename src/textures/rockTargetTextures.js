// Breakable targets for the rock-target-practice set piece.
// Three variants (vase / bottle / jug) so the row looks varied, plus a
// small shard used for the break-shatter particle effect.
export function generateRockTargetTextures(scene) {
  // --- Terracotta vase (8x13) ---
  const vaseC = scene.textures.createCanvas("target-vase", 8, 13);
  const v = vaseC.context;
  // Neck
  v.fillStyle = "#a35a2e";
  v.fillRect(2, 0, 4, 1);
  v.fillStyle = "#c8754a";
  v.fillRect(2, 1, 4, 2);
  // Shoulder
  v.fillStyle = "#b8663a";
  v.fillRect(1, 3, 6, 1);
  // Body
  v.fillStyle = "#c8754a";
  v.fillRect(0, 4, 8, 6);
  v.fillStyle = "#e09065"; // highlight left
  v.fillRect(1, 5, 1, 4);
  v.fillStyle = "#8a4a22"; // shadow right
  v.fillRect(6, 5, 1, 4);
  // Decorative band
  v.fillStyle = "#4a2a10";
  v.fillRect(0, 7, 8, 1);
  // Base
  v.fillStyle = "#a35a2e";
  v.fillRect(1, 10, 6, 1);
  v.fillStyle = "#8a4a22";
  v.fillRect(2, 11, 4, 2);
  vaseC.refresh();

  // --- Glass bottle (6x14) ---
  const bottleC = scene.textures.createCanvas("target-bottle", 6, 14);
  const b = bottleC.context;
  // Cap
  b.fillStyle = "#3a2010";
  b.fillRect(2, 0, 2, 1);
  b.fillStyle = "#5a3018";
  b.fillRect(2, 1, 2, 1);
  // Neck
  b.fillStyle = "#3a6a4a";
  b.fillRect(2, 2, 2, 3);
  // Body
  b.fillStyle = "#4a8a5a";
  b.fillRect(0, 5, 6, 8);
  // Highlight stripe
  b.fillStyle = "#7acc88";
  b.fillRect(1, 6, 1, 6);
  // Shadow
  b.fillStyle = "#2a5a38";
  b.fillRect(4, 6, 1, 6);
  // Base
  b.fillStyle = "#2a4a34";
  b.fillRect(0, 13, 6, 1);
  bottleC.refresh();

  // --- Round jug (10x12) with handle ---
  const jugC = scene.textures.createCanvas("target-jug", 10, 12);
  const j = jugC.context;
  // Handle (right side)
  j.fillStyle = "#8a5a2e";
  j.fillRect(8, 4, 2, 1);
  j.fillRect(9, 5, 1, 3);
  j.fillRect(8, 8, 2, 1);
  // Body (round-ish)
  j.fillStyle = "#d9a86a";
  j.fillRect(1, 3, 7, 7);
  j.fillRect(0, 4, 9, 5);
  j.fillStyle = "#f0c08a"; // highlight
  j.fillRect(2, 4, 1, 4);
  j.fillStyle = "#a67840"; // shadow
  j.fillRect(6, 5, 1, 4);
  // Neck
  j.fillStyle = "#b88850";
  j.fillRect(3, 1, 3, 2);
  j.fillStyle = "#8a5a2e";
  j.fillRect(3, 0, 3, 1);
  // Base shadow
  j.fillStyle = "#8a5a2e";
  j.fillRect(1, 10, 7, 1);
  j.fillRect(2, 11, 5, 1);
  jugC.refresh();

  // --- Debris shard (3x3) — tinted at spawn to match the broken object ---
  const shardC = scene.textures.createCanvas("target-shard", 3, 3);
  const s = shardC.context;
  s.fillStyle = "#ffffff";
  s.fillRect(0, 0, 3, 3);
  s.fillStyle = "#cccccc";
  s.fillRect(2, 2, 1, 1);
  shardC.refresh();
}
