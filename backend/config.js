module.exports = {
  PORT: process.env.PORT || 3001,
  TICK_RATE: 300,
  MAP_SIZE: 2000,
  INITIAL_ORBS: 500,
  ORB_RESPAWN_THRESHOLD: 1000,
  MAX_BOTS: 20,

  ORB_TYPES: [
    { radius: 5, value: 1, color: "#88F" }, // petit
    { radius: 10, value: 3, color: "#8F8" }, // moyen
    { radius: 15, value: 5, color: "#F88" }, // gros
    { radius: 20, value: 8, color: "#FF0" }, // très gros (lumineux)
  ],
};
