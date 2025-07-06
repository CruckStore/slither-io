const { MAP_SIZE } = require("../config");

function randomPosition() {
  return {
    x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
    y: Math.random() * MAP_SIZE - MAP_SIZE / 2,
  };
}

module.exports = { randomPosition };
