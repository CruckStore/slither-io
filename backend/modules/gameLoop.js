const { TICK_RATE } = require("../config");
const { maintainBots, updateBotsAI } = require("./bots");
const { respawnOrbs } = require("./orbs");

function startGameLoop(players, orbs, io) {
  setInterval(() => {
    maintainBots(players);
    updateBotsAI(players, orbs);

    players.forEach((p) => {
      p.direction += p.pendingAngle;
      p.pendingAngle = 0;
      const head = p.snake[0];
      const nx = head.x + Math.cos(p.direction) * p.speed;
      const ny = head.y + Math.sin(p.direction) * p.speed;
      p.snake.unshift({ x: nx, y: ny });
      p.snake.pop();
    });

    players.forEach((p) => {
      const head = p.snake[0];
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        const dx = o.x - head.x,
          dy = o.y - head.y;
        if (dx * dx + dy * dy < 15 * 15) {
          orbs.splice(i, 1);
          const tail = p.snake[p.snake.length - 1];
          p.snake.push({ x: tail.x, y: tail.y });
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
      })),
      orbs,
    };
    io.emit("state", snapshot);
  }, 1000 / TICK_RATE);
}

module.exports = { startGameLoop };
