const { INITIAL_ORBS, ORB_RESPAWN_THRESHOLD } = require("../config");
const { randomPosition } = require("../utils/randomPosition");

function initOrbs(orbs) {
  for (let i = 0; i < INITIAL_ORBS; i++) {
    orbs.push({
      ...randomPosition(),
      color:
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0"),
    });
  }
}

function respawnOrbs(orbs) {
  while (orbs.length < ORB_RESPAWN_THRESHOLD) {
    orbs.push({
      ...randomPosition(),
      color:
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0"),
    });
  }
}

module.exports = { initOrbs, respawnOrbs };
