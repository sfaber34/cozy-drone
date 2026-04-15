// Paper plane set-piece texture — tiny folded-paper dart.
// Drawn pointing up (angle = 0) so setRotation matches direction of travel.
export function generatePaperPlaneTextures(scene) {
  // --- Paper plane (5x7, pointing up) ---
  const ppC = scene.textures.createCanvas("paper-plane", 5, 7);
  const p = ppC.context;
  // Outline / shadow
  p.fillStyle = "#9a9a9a";
  p.fillRect(2, 0, 1, 1);
  p.fillRect(1, 1, 3, 1);
  p.fillRect(0, 2, 5, 1);
  p.fillRect(0, 3, 5, 1);
  p.fillRect(1, 4, 3, 1);
  p.fillRect(1, 5, 3, 1);
  p.fillRect(2, 6, 1, 1);
  // White paper body
  p.fillStyle = "#ffffff";
  p.fillRect(2, 0, 1, 1);
  p.fillRect(1, 1, 3, 1);
  p.fillRect(0, 2, 5, 1);
  p.fillRect(1, 3, 3, 1);
  // Center crease (darker line down the middle)
  p.fillStyle = "#cfcfcf";
  p.fillRect(2, 1, 1, 5);
  // Wing-tip shadows at the back edge
  p.fillStyle = "#bbbbbb";
  p.fillRect(0, 3, 1, 1);
  p.fillRect(4, 3, 1, 1);
  ppC.refresh();
}
