"use strict";

const { MAX_BOTS, MAP_SIZE } = require("../config");
const { randomPosition } = require("../utils/randomPosition");
const { v4: uuidv4 } = require("uuid");
const BOUND = MAP_SIZE / 2;

const VISION_DIST = 200;
const NUM_CANDIDATES = 7;
const MAX_DELTA = Math.PI / 4;
const TURN_RATE = 0.2;

const WEIGHTS = {
  ORB: 1.5,
  CLUSTER: 3.0,
  AVOID_BOT: -5.0,
  AVOID_WALL: -3.0,
  JITTER: 0.1,
};

function maintainBots(players) {
  const botCount = Array.from(players.values()).filter((p) => p.isBot).length;
  const toSpawn = Math.max(0, MAX_BOTS - botCount);
  for (let i = 0; i < toSpawn; i++) {
    const id = uuidv4();
    const head = randomPosition();

    const snake = Array.from({ length: 30 }, () => ({ x: head.x, y: head.y }));
    players.set(id, {
      id,
      username: `Bot_${id.slice(0, 4)}`,
      snake,
      direction: Math.random() * Math.PI * 2,
      speed: 90,
      color:
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0"),
      pendingAngle: 0,
      isBot: true,
      score: 0,
    });
  }
}

function findCluster(orbs, head, radius = 400) {
  const nearby = orbs.filter((o) => {
    const dx = o.x - head.x,
      dy = o.y - head.y;
    return dx * dx + dy * dy < radius * radius;
  });
  if (!nearby.length) return null;
  const cx = nearby.reduce((sum, o) => sum + o.x, 0) / nearby.length;
  const cy = nearby.reduce((sum, o) => sum + o.y, 0) / nearby.length;
  return { x: cx, y: cy };
}

function updateBotsAI(players, orbs) {
  const bots = Array.from(players.values()).filter((p) => p.isBot);
  const humans = Array.from(players.values()).filter((p) => !p.isBot);

  bots.forEach((p) => {
    const head = p.snake[0];

    let fleeVX = 0,
      fleeVY = 0;
    players.forEach((q) => {
      q.snake.forEach((seg, idx) => {
        if (q.id === p.id && idx === 0) return;
        const dx = head.x - seg.x,
          dy = head.y - seg.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 60 * 60) {
          const d = Math.sqrt(d2) || 1;
          fleeVX += (dx / d) * 15;
          fleeVY += (dy / d) * 15;
        }
      });
    });

    if (head.x > BOUND - 80) fleeVX -= 10;
    if (head.x < -BOUND + 80) fleeVX += 10;
    if (head.y > BOUND - 80) fleeVY -= 10;
    if (head.y < -BOUND + 80) fleeVY += 10;

    if (fleeVX !== 0 || fleeVY !== 0) {
      const angle = Math.atan2(fleeVY, fleeVX);
      let delta =
        ((angle - p.direction + Math.PI * 3) % (2 * Math.PI)) - Math.PI;
      p.direction +=
        Math.sign(delta) * Math.min(Math.abs(delta), MAX_DELTA) * TURN_RATE;
      return;
    }

    let bestScore = -Infinity;
    let bestAngle = p.direction;

    const cluster = findCluster(orbs, head);
    for (let i = 0; i < NUM_CANDIDATES; i++) {
      const offset = (i / (NUM_CANDIDATES - 1) - 0.5) * MAX_DELTA * 2;
      const candAng = p.direction + offset;
      const px = head.x + Math.cos(candAng) * VISION_DIST;
      const py = head.y + Math.sin(candAng) * VISION_DIST;

      let score = 0;

      if (cluster) {
        const dx = cluster.x - px,
          dy = cluster.y - py;
        const d2 = dx * dx + dy * dy;
        score += WEIGHTS.CLUSTER / (Math.sqrt(d2) + 1);
      }

      let minO = Infinity;
      for (const o of orbs) {
        const dx = o.x - px,
          dy = o.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < minO) minO = d2;
      }
      if (minO < Infinity) {
        score += WEIGHTS.ORB / (Math.sqrt(minO) + 1);
      }

      players.forEach((q) => {
        if (q.id === p.id) return;
        const dx = q.snake[0].x - px,
          dy = q.snake[0].y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 100 * 100) {
          score += WEIGHTS.AVOID_BOT / (Math.sqrt(d2) + 1);
        }
      });

      if (px > BOUND) score += WEIGHTS.AVOID_WALL * (BOUND - px);
      if (px < -BOUND) score += WEIGHTS.AVOID_WALL * (-BOUND - px);
      if (py > BOUND) score += WEIGHTS.AVOID_WALL * (BOUND - py);
      if (py < -BOUND) score += WEIGHTS.AVOID_WALL * (-BOUND - py);

      score += (Math.random() - 0.5) * WEIGHTS.JITTER;

      if (score > bestScore) {
        bestScore = score;
        bestAngle = candAng;
      }
    }

    let delta =
      ((bestAngle - p.direction + Math.PI * 3) % (2 * Math.PI)) - Math.PI;
    p.direction +=
      Math.sign(delta) * Math.min(Math.abs(delta), MAX_DELTA) * TURN_RATE;
  });
}

module.exports = { maintainBots, updateBotsAI };
