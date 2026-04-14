export function generateRockFightTextures(scene) {
  // --- Pixel rock (4x4) ---
  const canvas = scene.textures.createCanvas("thrown-rock", 4, 4);
  const ctx = canvas.context;
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(0, 1, 4, 2);
  ctx.fillRect(1, 0, 2, 4);
  ctx.fillStyle = "#9a9a9a"; // highlight top-left
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillRect(0, 1, 1, 1);
  ctx.fillStyle = "#555555"; // shadow bottom-right
  ctx.fillRect(2, 3, 2, 1);
  ctx.fillRect(3, 2, 1, 1);
  canvas.refresh();
}
