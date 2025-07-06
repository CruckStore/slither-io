const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3001;
const TICK_RATE = 20;
const MAP_SIZE = 2000;
const INITIAL_ORBS = 500;
const ORB_RESPAWN_THRESHOLD = 500;
const MAX_BOTS = 20;

const players = new Map();
const orbs = [];

function randomPosition() {
  return {
    x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
    y: Math.random() * MAP_SIZE - MAP_SIZE / 2
  };
}

function initOrbs() {
  for (let i = 0; i < INITIAL_ORBS; i++) {
    orbs.push({
      ...randomPosition(),
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    });
  }
}

function respawnOrbs() {
  while (orbs.length < ORB_RESPAWN_THRESHOLD) {
    orbs.push({
      ...randomPosition(),
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    });
  }
}

function maintainBots() {
  const currentBots = Array.from(players.values()).filter(p => p.isBot).length;
  const toSpawn = MAX_BOTS - currentBots;
  for (let i = 0; i < toSpawn; i++) {
    const id = uuidv4();
    players.set(id, {
      id,
      username: `Bot_${id.slice(0, 4)}`,
      snake: [ randomPosition() ],
      direction: Math.random() * Math.PI * 2,
      speed: 1.8,
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
      pendingAngle: 0,
      isBot: true
    });
  }
}

function updateBotsAI() {
  players.forEach(p => {
    if (!p.isBot) return;
    let nearestOrb = null;
    let minDist2 = Infinity;
    for (const o of orbs) {
      const dx = o.x - p.snake[0].x;
      const dy = o.y - p.snake[0].y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < minDist2) {
        minDist2 = dist2;
        nearestOrb = o;
      }
    }
    if (!nearestOrb) return;
    const dx = nearestOrb.x - p.snake[0].x;
    const dy = nearestOrb.y - p.snake[0].y;
    const target = Math.atan2(dy, dx);
    let delta = ((target - p.direction + Math.PI) % (2 * Math.PI)) - Math.PI;
    p.direction += delta * 0.05;
  });
}

initOrbs();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});


io.on('connection', socket => {
  socket.on('join', ({ username }) => {
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    players.set(socket.id, {
      id: socket.id,
      username: username || `Player_${socket.id.slice(0,4)}`,
      snake: [ randomPosition() ],
      direction: Math.random() * Math.PI * 2,
      speed: 2,
      color,
      pendingAngle: 0,
      isBot: false
    });
  });

  socket.on('steer', ({ angle }) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.direction = angle;
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
  });
});

function gameTick() {
  maintainBots();
  updateBotsAI();

  players.forEach(p => {
    p.direction += p.pendingAngle;
    p.pendingAngle = 0;

    const head = p.snake[0];
    const nx = head.x + Math.cos(p.direction) * p.speed;
    const ny = head.y + Math.sin(p.direction) * p.speed;
    p.snake.unshift({ x: nx, y: ny });
    p.snake.pop();
  });

  players.forEach(p => {
    const head = p.snake[0];
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - head.x;
      const dy = o.y - head.y;
      if (dx * dx + dy * dy < 15 * 15) {
        orbs.splice(i, 1);
        const tail = p.snake[p.snake.length - 1];
        p.snake.push({ x: tail.x, y: tail.y });
      }
    }
  });

  respawnOrbs();

  const snapshot = {
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      username: p.username,
      snake: p.snake,
      color: p.color
    })),
    orbs
  };
  io.emit('state', snapshot);
}

setInterval(gameTick, 1000 / TICK_RATE);

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur backend Slither-clone démarré sur le port ${PORT}`);
});
