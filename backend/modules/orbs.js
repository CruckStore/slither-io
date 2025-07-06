const { INITIAL_ORBS, ORB_RESPAWN_THRESHOLD, ORB_TYPES } = require("../config");
const { randomPosition } = require("../utils/randomPosition");

function createOrb() {
  const type = ORB_TYPES[Math.floor(Math.random() * ORB_TYPES.length)];
  return {
    ...randomPosition(),
    radius: type.radius,
    value: type.value,
    color: type.color,
  };
}

function initOrbs(orbs) {
  for (let i = 0; i < INITIAL_ORBS; i++) {
    orbs.push(createOrb());
  }
}

function respawnOrbs(orbs) {
  while (orbs.length < ORB_RESPAWN_THRESHOLD) {
    orbs.push(createOrb());
  }
}

module.exports = { initOrbs, respawnOrbs };
