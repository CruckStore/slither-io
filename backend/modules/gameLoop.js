"use strict";

const { TICK_RATE, MAP_SIZE } = require("../config");
const { maintainBots, updateBotsAI } = require("./bots");
const { respawnOrbs } = require("./orbs");

const BOUND = MAP_SIZE / 2;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function startGameLoop(players, orbs, io) {
  let lastTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    maintainBots(players);
    updateBotsAI(players, orbs);

    players.forEach((p) => {
      p.direction += p.pendingAngle;
      p.pendingAngle = 0;

      const head = p.snake[0];
      const dist = p.speed * dt;
      let nx = head.x + Math.cos(p.direction) * dist;
      let ny = head.y + Math.sin(p.direction) * dist;

      nx = clamp(nx, -BOUND, BOUND);
      ny = clamp(ny, -BOUND, BOUND);

      p.snake.unshift({ x: nx, y: ny });
      p.snake.pop();
    });

    players.forEach((p) => {
      const head = p.snake[0];
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        const dx = o.x - head.x;
        const dy = o.y - head.y;
        if (dx * dx + dy * dy < (o.radius + 10) ** 2) {
          orbs.splice(i, 1);
          p.score += o.value;
          const tail = p.snake[p.snake.length - 1];
          for (let k = 0; k < o.value; k++) {
            p.snake.push({ x: tail.x, y: tail.y });
          }
        }
      }
    });

    const toRemove = new Set();
    players.forEach((p) => {
      const head = p.snake[0];
      players.forEach((q) => {
        if (p.id === q.id) return;
        q.snake.forEach((seg) => {
          const dx = seg.x - head.x;
          const dy = seg.y - head.y;
          if (dx * dx + dy * dy < 10 * 10) {
            toRemove.add(p.id);
          }
        });
      });
    });

    toRemove.forEach((id) => {
      const p = players.get(id);
      if (!p) return;
      p.snake.forEach((seg) => {
        orbs.push({
          x: seg.x,
          y: seg.y,
          radius: 5,
          value: 1,
          color: p.color,
        });
      });
      players.delete(id);
      io.to(id).emit("dead");
    });

    respawnOrbs(orbs);

    const snapshot = {
      players: Array.from(players.values()).map((p) => ({
        id: p.id,
        username: p.username,
        snake: p.snake,
        color: p.color,
        score: p.score,
        speed: p.speed,
      })),
      orbs,
    };
    io.emit("state", snapshot);
  }, 1000 / TICK_RATE);
}

module.exports = { startGameLoop };
