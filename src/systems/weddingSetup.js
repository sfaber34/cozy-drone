import { TILE, SCALE, WEDDING_X, WEDDING_Y, WEDDING_HEART_INTERVAL } from "../constants.js";

export function createWedding(scene, rng) {
  const weddingX = WEDDING_X * TILE * SCALE;
  const weddingY = WEDDING_Y * TILE * SCALE;
  scene.weddingPos = { x: weddingX, y: weddingY };

  // Flat desert-colored ground to cover desert props under the wedding
  const groundW = 500;
  const groundH = 350;
  const ground = scene.add.graphics();
  ground.fillStyle(0xd2b48c, 1);
  ground.fillRect(weddingX - groundW / 2, weddingY - groundH / 2, groundW, groundH);
  ground.setDepth(1.1);

  // Wedding rug (aisle)
  for (let r = -2; r <= 2; r++) {
    scene.add
      .image(weddingX, weddingY + r * 12 * SCALE, "wedding-rug")
      .setScale(SCALE)
      .setDepth(1.5);
  }

  // Wedding arch at the front
  scene.add
    .image(weddingX, weddingY - 3 * 12 * SCALE, "wedding-arch")
    .setScale(SCALE)
    .setDepth(2);

  // Lanterns flanking the aisle
  for (let li = -2; li <= 2; li++) {
    scene.add
      .image(weddingX - 50, weddingY + li * 40, "lantern")
      .setScale(SCALE)
      .setDepth(2);
    scene.add
      .image(weddingX + 50, weddingY + li * 40, "lantern")
      .setScale(SCALE)
      .setDepth(2);
  }

  // Cushion seating (rows on each side)
  for (let row = 0; row < 4; row++) {
    for (let seat = 0; seat < 5; seat++) {
      scene.add
        .image(weddingX - 80 - seat * 22, weddingY - 30 + row * 30, "cushion")
        .setScale(SCALE)
        .setDepth(1.5);
      scene.add
        .image(weddingX + 80 + seat * 22, weddingY - 30 + row * 30, "cushion")
        .setScale(SCALE)
        .setDepth(1.5);
    }
  }

  // Priest, Bride, Groom — each gets a unique person skin
  const priestSkinId = rng.between(0, 199);
  const brideSkinId = rng.between(0, 199);
  const groomSkinId = rng.between(0, 199);

  const priestSprite = scene.add
    .image(weddingX, weddingY - 3 * 12 * SCALE + 20, `person-stand-${priestSkinId}`)
    .setScale(SCALE)
    .setDepth(3);

  const brideSprite = scene.add
    .image(weddingX - 25, weddingY - 2 * 12 * SCALE, `person-stand-${brideSkinId}`)
    .setScale(SCALE)
    .setDepth(3);
  const groomSprite = scene.add
    .image(weddingX + 25, weddingY - 2 * 12 * SCALE, `person-stand-${groomSkinId}`)
    .setScale(SCALE)
    .setDepth(3);

  // Hearts floating from the couple
  scene.time.addEvent({
    delay: WEDDING_HEART_INTERVAL,
    loop: true,
    callback: () => {
      if (!brideSprite.active || !groomSprite.active) return;
      if (
        scene.brideEntry.state !== "idle" ||
        scene.groomEntry.state !== "idle"
      )
        return;
      const hx = (brideSprite.x + groomSprite.x) / 2;
      const hy = brideSprite.y - 10;
      const heart = scene.add
        .image(hx, hy, "heart")
        .setScale(SCALE * 0.8)
        .setDepth(4);
      scene.hudCam.ignore(heart);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const dist = 40 + Math.random() * 40;
      scene.tweens.add({
        targets: heart,
        x: hx + Math.cos(angle) * dist,
        y: hy + Math.sin(angle) * dist - 20,
        alpha: 0,
        scale: SCALE * (0.4 + Math.random() * 0.4),
        duration: 1200 + Math.random() * 600,
        ease: "Quad.easeOut",
        onComplete: () => heart.destroy(),
      });
    },
  });

  // Wedding guests (seated on cushions, using different skins)
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 4; row++) {
      for (let seat = 0; seat < 4; seat++) {
        const gx = weddingX + side * (80 + seat * 22);
        const gy = weddingY - 30 + row * 30;
        const skinId = rng.between(0, 199);
        const sprite = scene.add
          .image(gx, gy, `person-stand-${skinId}`)
          .setScale(SCALE)
          .setDepth(2);
        scene.people.push({
          sprite,
          skinId,
          state: "idle",
          greeting: "",
          noGreet: true,
          scatterPanic: true,
          returnHome: { x: gx, y: gy, event: "wedding" },
          bubble: null,
          waveTimer: 0,
          waveFrame: 0,
          runAngle: 0,
          runTimer: 0,
          runFrame: 0,
          wanderTimer: 0,
          wanderDuration: 999,
          wanderAngle: null,
          hideTarget: null,
          homeX: gx,
          homeY: gy,
        });
      }
    }
  }

  // Also add bride, groom, priest to people array so they can react
  const weddingPeople = [
    { sprite: brideSprite, skinId: brideSkinId },
    { sprite: groomSprite, skinId: groomSkinId },
    { sprite: priestSprite, skinId: priestSkinId },
  ];
  const weddingEntries = [];
  for (const wp of weddingPeople) {
    const entry = {
      sprite: wp.sprite,
      skinId: wp.skinId,
      state: "idle",
      greeting: "",
      noGreet: true,
      scatterPanic: true,
      returnHome: { x: wp.sprite.x, y: wp.sprite.y, event: "wedding" },
      bubble: null,
      waveTimer: 0,
      waveFrame: 0,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 999,
      wanderAngle: null,
      hideTarget: null,
      homeX: wp.sprite.x,
      homeY: wp.sprite.y,
    };
    scene.people.push(entry);
    weddingEntries.push(entry);
  }
  scene.brideEntry = weddingEntries[0];
  scene.groomEntry = weddingEntries[1];
}
