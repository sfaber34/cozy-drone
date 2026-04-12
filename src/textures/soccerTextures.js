export function generateSoccerTextures(scene) {
  // --- Soccer ball (5x5) ---
  const ballCanvas = scene.textures.createCanvas('soccer-ball', 5, 5);
  const sbc = ballCanvas.context;
  sbc.fillStyle = '#fff';
  sbc.fillRect(1, 0, 3, 1);
  sbc.fillRect(0, 1, 5, 3);
  sbc.fillRect(1, 4, 3, 1);
  sbc.fillStyle = '#222';
  sbc.fillRect(2, 1, 1, 1);
  sbc.fillRect(1, 2, 1, 1);
  sbc.fillRect(3, 3, 1, 1);
  ballCanvas.refresh();

  // --- Soccer goal (top-down, 20x6) ---
  const goalCanvas = scene.textures.createCanvas('soccer-goal', 20, 6);
  const glc = goalCanvas.context;
  glc.fillStyle = '#fff';
  glc.fillRect(0, 0, 2, 6);
  glc.fillRect(18, 0, 2, 6);
  glc.fillRect(0, 0, 20, 1);
  glc.fillStyle = '#ccc';
  for (let ny = 1; ny < 6; ny += 2) {
    for (let nx = 2; nx < 18; nx += 2) {
      glc.fillRect(nx, ny, 1, 1);
    }
  }
  goalCanvas.refresh();

  // --- Soccer field line (horizontal, 1px white) ---
  const fieldLineCanvas = scene.textures.createCanvas('field-line-h', 16, 1);
  const flc = fieldLineCanvas.context;
  flc.fillStyle = '#fff';
  flc.fillRect(0, 0, 16, 1);
  fieldLineCanvas.refresh();

  // --- Soccer field line vertical ---
  const fieldLineVCanvas = scene.textures.createCanvas('field-line-v', 1, 16);
  const flvc = fieldLineVCanvas.context;
  flvc.fillStyle = '#fff';
  flvc.fillRect(0, 0, 1, 16);
  fieldLineVCanvas.refresh();

  // --- Soccer player teams ---
  const teamColors = [
    { jersey: '#cc2222', shorts: '#fff', name: 'team-a' },
    { jersey: '#2244cc', shorts: '#fff', name: 'team-b' },
  ];
  for (const team of teamColors) {
    // Standing
    const tsCanvas = scene.textures.createCanvas(`${team.name}-stand`, 10, 14);
    const ts = tsCanvas.context;
    ts.fillStyle = '#c49a6c';
    ts.fillRect(3, 0, 4, 4);
    ts.fillStyle = '#222';
    ts.fillRect(4, 1, 1, 1);
    ts.fillRect(6, 1, 1, 1);
    ts.fillStyle = team.jersey;
    ts.fillRect(3, 4, 4, 4);
    ts.fillStyle = '#c49a6c';
    ts.fillRect(2, 5, 1, 2);
    ts.fillRect(7, 5, 1, 2);
    ts.fillStyle = team.shorts;
    ts.fillRect(3, 8, 2, 2);
    ts.fillRect(5, 8, 2, 2);
    ts.fillStyle = '#c49a6c';
    ts.fillRect(3, 10, 2, 2);
    ts.fillRect(5, 10, 2, 2);
    ts.fillStyle = '#333';
    ts.fillRect(3, 12, 2, 2);
    ts.fillRect(5, 12, 2, 2);
    tsCanvas.refresh();

    // Running frame 1
    const tr1Canvas = scene.textures.createCanvas(`${team.name}-run1`, 10, 14);
    const tr1 = tr1Canvas.context;
    tr1.fillStyle = '#c49a6c';
    tr1.fillRect(3, 0, 4, 4);
    tr1.fillStyle = '#222';
    tr1.fillRect(4, 1, 1, 1);
    tr1.fillRect(6, 1, 1, 1);
    tr1.fillStyle = team.jersey;
    tr1.fillRect(3, 4, 4, 4);
    tr1.fillStyle = '#c49a6c';
    tr1.fillRect(1, 4, 2, 1);
    tr1.fillRect(7, 5, 2, 1);
    tr1.fillStyle = team.shorts;
    tr1.fillRect(3, 8, 2, 2);
    tr1.fillRect(6, 8, 2, 2);
    tr1.fillStyle = '#c49a6c';
    tr1.fillRect(3, 10, 2, 2);
    tr1.fillRect(6, 10, 1, 2);
    tr1.fillStyle = '#333';
    tr1.fillRect(3, 12, 2, 2);
    tr1.fillRect(6, 11, 2, 2);
    tr1Canvas.refresh();

    // Running frame 2
    const tr2Canvas = scene.textures.createCanvas(`${team.name}-run2`, 10, 14);
    const tr2 = tr2Canvas.context;
    tr2.fillStyle = '#c49a6c';
    tr2.fillRect(3, 0, 4, 4);
    tr2.fillStyle = '#222';
    tr2.fillRect(4, 1, 1, 1);
    tr2.fillRect(6, 1, 1, 1);
    tr2.fillStyle = team.jersey;
    tr2.fillRect(3, 4, 4, 4);
    tr2.fillStyle = '#c49a6c';
    tr2.fillRect(1, 5, 2, 1);
    tr2.fillRect(7, 4, 2, 1);
    tr2.fillStyle = team.shorts;
    tr2.fillRect(3, 8, 2, 2);
    tr2.fillRect(5, 8, 2, 3);
    tr2.fillStyle = '#c49a6c';
    tr2.fillRect(3, 10, 2, 1);
    tr2.fillRect(5, 10, 2, 2);
    tr2.fillStyle = '#333';
    tr2.fillRect(3, 11, 2, 2);
    tr2.fillRect(5, 12, 2, 2);
    tr2Canvas.refresh();
  }
}
