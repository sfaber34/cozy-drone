import { WORLD_W, WORLD_H, SCALE } from "../constants.js";

export function createWedding(scene, rng) {
  const weddingX = WORLD_W * SCALE * 0.75;
  const weddingY = WORLD_H * SCALE * 0.6;
  scene.weddingPos = { x: weddingX, y: weddingY };

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

  // Priest at the arch
  const priestSprite = scene.add
    .image(weddingX, weddingY - 3 * 12 * SCALE + 20, "priest")
    .setScale(SCALE)
    .setDepth(3);

  // Bride & Groom in front of the arch
  const brideSprite = scene.add
    .image(weddingX - 25, weddingY - 2 * 12 * SCALE, "bride")
    .setScale(SCALE)
    .setDepth(3);
  const groomSprite = scene.add
    .image(weddingX + 25, weddingY - 2 * 12 * SCALE, "groom")
    .setScale(SCALE)
    .setDepth(3);

  // Hearts floating from the couple
  scene.time.addEvent({
    delay: 800,
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
          scatterPanic: true,
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
    { sprite: brideSprite },
    { sprite: groomSprite },
    { sprite: priestSprite },
  ];
  const weddingEntries = [];
  for (const wp of weddingPeople) {
    const entry = {
      sprite: wp.sprite,
      skinId: 0,
      state: "idle",
      greeting: "",
      noGreet: true,
      scatterPanic: true,
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
