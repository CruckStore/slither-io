const { TICK_RATE } = require("../config");
const { maintainBots, updateBotsAI } = require("./bots");
const { respawnOrbs } = require("./orbs");

function startGameLoop(players, orbs, io) {
  let lastTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTime) / 20;
    lastTime = now;

    maintainBots(players);
    updateBotsAI(players, orbs);

    players.forEach((p) => {
      p.direction += p.pendingAngle;
      p.pendingAngle = 0;

      const head = p.snake[0];
      const dist = p.speed * dt;
      const nx = head.x + Math.cos(p.direction) * dist;
      const ny = head.y + Math.sin(p.direction) * dist;

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

    respawnOrbs(orbs);

    const snapshot = {
      players: Array.from(players.values()).map((p) => ({
        id: p.id,
        username: p.username,
        snake: p.snake,
        color: p.color,
        score: p.score,
      })),
      orbs,
    };
    io.emit("state", snapshot);
  }, 1000 / TICK_RATE);
}

module.exports = { startGameLoop };
