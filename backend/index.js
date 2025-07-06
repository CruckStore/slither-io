const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { initOrbs } = require("./modules/orbs");
const { startGameLoop } = require("./modules/gameLoop");
const { randomPosition } = require("./utils/randomPosition");
const { PORT } = require("./config");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const players = new Map();
const orbs = [];

initOrbs(orbs);

io.on("connection", (socket) => {
  socket.on("join", ({ username }) => {
    const color =
      "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0");
    players.set(socket.id, {
      id: socket.id,
      username: username || `Player_${socket.id.slice(0, 4)}`,
      snake: [randomPosition()],
      direction: Math.random() * Math.PI * 2,
      speed: 2,
      color,
      pendingAngle: 0,
      isBot: false,
    });
  });

  socket.on("steer", ({ angle }) => {
    const p = players.get(socket.id);
    if (p) p.direction = angle;
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
  });
});

startGameLoop(players, orbs, io);

server.listen(PORT, () => {
  console.log(`🚀 Backend started on port ${PORT}`);
});
