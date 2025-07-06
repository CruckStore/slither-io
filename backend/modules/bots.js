const { MAX_BOTS } = require("../config");
const { randomPosition } = require("../utils/randomPosition");
const { v4: uuidv4 } = require("uuid");

function maintainBots(players) {
  const botCount = Array.from(players.values()).filter((p) => p.isBot).length;
  const toSpawn = MAX_BOTS - botCount;
  for (let i = 0; i < toSpawn; i++) {
    const id = uuidv4();
    players.set(id, {
      id,
      username: `Bot_${id.slice(0, 4)}`,
      snake: [randomPosition()],
      direction: Math.random() * Math.PI * 2,
      speed: 1.8,
      color:
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0"),
      pendingAngle: 0,
      isBot: true,
    });
  }
}

function updateBotsAI(players, orbs) {
  players.forEach((p) => {
    if (!p.isBot) return;
    let nearest = null,
      minD = Infinity;
    orbs.forEach((o) => {
      const dx = o.x - p.snake[0].x;
      const dy = o.y - p.snake[0].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < minD) {
        minD = d2;
        nearest = o;
      }
    });
    if (!nearest) return;
    const dx = nearest.x - p.snake[0].x;
    const dy = nearest.y - p.snake[0].y;
    const target = Math.atan2(dy, dx);
    let delta = ((target - p.direction + Math.PI) % (2 * Math.PI)) - Math.PI;
    p.direction += delta * 0.05;
  });
}

module.exports = { maintainBots, updateBotsAI };
