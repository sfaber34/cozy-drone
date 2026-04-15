// Hookah set-piece textures: the hookah itself (top-down-ish ¾ view) and
// a thin hose segment that connects each smoker to the base.
export function generateHookahTextures(scene) {
  // --- Hookah (12x22, vase + stem + bowl with coal) ---
  const hkC = scene.textures.createCanvas("hookah", 12, 22);
  const c = hkC.context;

  // Glass base (bulbous vase)
  c.fillStyle = "#4a6a8a";       // dark glass body
  c.fillRect(2, 12, 8, 7);
  c.fillRect(1, 13, 10, 5);
  c.fillStyle = "#6a8aaa";        // highlight
  c.fillRect(2, 13, 1, 3);
  c.fillStyle = "#2a4a6a";        // shadow
  c.fillRect(9, 14, 1, 3);
  // Liquid line
  c.fillStyle = "#5a9ac4";
  c.fillRect(2, 15, 8, 1);
  c.fillStyle = "#7ab4d8";        // liquid sparkle
  c.fillRect(3, 15, 1, 1);
  // Base rim / foot
  c.fillStyle = "#222";
  c.fillRect(2, 19, 8, 1);
  c.fillRect(3, 20, 6, 1);
  c.fillRect(4, 21, 4, 1);

  // Stem (tall thin metal tube)
  c.fillStyle = "#b5b5b5";
  c.fillRect(5, 5, 2, 8);
  c.fillStyle = "#e0e0e0";        // highlight
  c.fillRect(5, 5, 1, 8);

  // Purge / ornament band
  c.fillStyle = "#d9a94a";
  c.fillRect(4, 10, 4, 1);
  c.fillStyle = "#a8832a";
  c.fillRect(4, 11, 4, 1);

  // Bowl (ceramic saucer)
  c.fillStyle = "#7a4b2a";
  c.fillRect(3, 3, 6, 2);
  c.fillRect(2, 4, 8, 1);
  c.fillStyle = "#a06a3a";
  c.fillRect(3, 3, 6, 1);

  // Hot coal on top of bowl (glowing)
  c.fillStyle = "#3a1a10";        // charcoal shell
  c.fillRect(4, 1, 4, 2);
  c.fillStyle = "#ff5522";        // ember
  c.fillRect(5, 1, 2, 1);
  c.fillStyle = "#ffcc33";        // hot center
  c.fillRect(5, 2, 1, 1);

  hkC.refresh();

  // --- Hose segment (8x1, thin dark line used as a prop connecting smokers to the base) ---
  const hsC = scene.textures.createCanvas("hookah-hose", 8, 1);
  const h = hsC.context;
  h.fillStyle = "#4a2a1a";
  h.fillRect(0, 0, 8, 1);
  hsC.refresh();

  // --- Mouthpiece (3x4, small barrel at the smoker's end of the hose) ---
  const mpC = scene.textures.createCanvas("hookah-mouthpiece", 3, 4);
  const m = mpC.context;
  m.fillStyle = "#c9a26b";       // wooden barrel
  m.fillRect(0, 0, 3, 4);
  m.fillStyle = "#a8823a";       // shadow band
  m.fillRect(0, 3, 3, 1);
  m.fillStyle = "#2a1a0a";       // dark tip
  m.fillRect(1, 0, 1, 1);
  m.fillStyle = "#e3c080";       // highlight
  m.fillRect(0, 1, 1, 2);
  mpC.refresh();
}
