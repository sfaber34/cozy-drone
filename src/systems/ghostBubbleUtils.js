// Ghost-bubble cluster limiter.
//
// When many people die in a small area their speech bubbles stack on top
// of each other and become unreadable. This helper caps the number of
// ghost bubbles allowed per (radius, time-window) cluster — additional
// deaths still spawn ghosts, they just skip the speech bubble.
//
// Call exactly once per intended bubble:
//   if (tryRegisterGhostBubble(scene, x, y)) { /* create bubble */ }
//
// It trims expired entries, counts how many recent bubbles are within
// GHOST_BUBBLE_CLUSTER_RADIUS of (x, y), and either records + returns
// true (spawn allowed) or returns false (cluster full, skip bubble).
import {
  GHOST_BUBBLE_CLUSTER_RADIUS,
  GHOST_BUBBLE_CLUSTER_MAX,
  GHOST_BUBBLE_CLUSTER_WINDOW_MS,
} from "../constants.js";

export function tryRegisterGhostBubble(scene, x, y) {
  if (!scene._recentGhostBubbles) scene._recentGhostBubbles = [];
  const list = scene._recentGhostBubbles;

  const now = scene.time ? scene.time.now : performance.now();
  const windowStart = now - GHOST_BUBBLE_CLUSTER_WINDOW_MS;
  const radiusSq = GHOST_BUBBLE_CLUSTER_RADIUS * GHOST_BUBBLE_CLUSTER_RADIUS;

  // Drop expired entries in-place
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].t < windowStart) list.splice(i, 1);
  }

  let count = 0;
  for (const e of list) {
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy <= radiusSq) count++;
  }
  if (count >= GHOST_BUBBLE_CLUSTER_MAX) return false;

  list.push({ x, y, t: now });
  return true;
}
