const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const TICK_RATE = 20;
const MAP_SIZE = 2000;
const INITIAL_ORBS = 500;
const ORB_RESPAWN = 500;

const players = new Map();   // socketId -> player
const orbs = [];

// Utilitaires
function randPos() {
  return {
    x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
    y: Math.random() * MAP_SIZE - MAP_SIZE / 2
  };
}
function initOrbs() {
  for (let i = 0; i < INITIAL_ORBS; i++) {
    orbs.push({ ...randPos(), color: '#' + Math.floor(Math.random()*0xFFFFFF).toString(16) });
  }
}
initOrbs();

// Gestion des connexions
io.on('connection', socket => {
  socket.on('join', ({ username }) => {
    const color = '#' + Math.floor(Math.random()*0xFFFFFF).toString(16);
    players.set(socket.id, {
      id: socket.id,
      username,
      snake: [ randPos() ],
      direction: Math.random() * Math.PI * 2,
      speed: 2,
      color,
      pendingAngle: 0,
      isBot: false
    });
  });

  socket.on('steer', ({ angle }) => {
    const p = players.get(socket.id);
    if (p) p.pendingAngle = angle * 0.1;
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
  });
});

// Spawn de bots pour maintenir l’ambiance multijoueur
function spawnBots() {
  const botCount = Array.from(players.values()).filter(p => p.isBot).length;
  const toSpawn = 20 - botCount;
  for (let i = 0; i < toSpawn; i++) {
    const id = uuidv4();
    players.set(id, {
      id,
      username: 'Bot',
      snake: [ randPos() ],
      direction: Math.random() * Math.PI * 2,
      speed: 1.8,
      color: '#' + Math.floor(Math.random()*0xFFFFFF).toString(16),
      pendingAngle: 0,
      isBot: true
    });
  }
}

// Boucle de jeu
function gameLoop() {
  // IA des bots
  players.forEach(p => {
    if (p.isBot) {
      let nearest = null, minD = Infinity;
      orbs.forEach(o => {
        const dx = o.x - p.snake[0].x, dy = o.y - p.snake[0].y;
        const d = dx*dx + dy*dy;
        if (d < minD) { minD = d; nearest = o; }
      });
      if (nearest) {
        const dx = nearest.x - p.snake[0].x, dy = nearest.y - p.snake[0].y;
        const target = Math.atan2(dy, dx);
        let delta = ((target - p.direction + Math.PI) % (2*Math.PI)) - Math.PI;
        p.direction += delta * 0.05;
      }
    }
    // Appliquer le virage commandé
    p.direction += p.pendingAngle;
    p.pendingAngle = 0;

    // Avancer la tête
    const head = p.snake[0];
    const nx = head.x + Math.cos(p.direction)*p.speed;
    const ny = head.y + Math.sin(p.direction)*p.speed;
    p.snake.unshift({ x: nx, y: ny });
    p.snake.pop(); // longueur fixe sauf quand on mange
  });

  // Orbes → collision et croissance
  players.forEach(p => {
    const head = p.snake[0];
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - head.x, dy = o.y - head.y;
      if (dx*dx + dy*dy < 15*15) {
        orbs.splice(i, 1);
        // pousser un segment en queue
        const tail = p.snake[p.snake.length - 1];
        p.snake.push({ x: tail.x, y: tail.y });
      }
    }
  });

  // Respawn des orbes
  while (orbs.length < ORB_RESPAWN) {
    orbs.push({ ...randPos(), color: '#' + Math.floor(Math.random()*0xFFFFFF).toString(16) });
  }

  // Broadcast
  const state = {
    players: Array.from(players.values()).map(p => ({
      id: p.id, username: p.username, snake: p.snake, color: p.color
    })),
    orbs
  };
  io.emit('state', state);
}

// Lancer la boucle à fréquence constante
setInterval(() => {
  spawnBots();
  gameLoop();
}, 1000 / TICK_RATE);

const PORT = 3001;
server.listen(PORT, () => console.log(`Backend running on :${PORT}`));
