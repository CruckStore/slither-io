module.exports = {
  PORT: process.env.PORT || 3001,
  TICK_RATE: 20, // mises à jour / seconde
  MAP_SIZE: 2000, // taille du terrain
  INITIAL_ORBS: 500, // orbes au démarrage
  ORB_RESPAWN_THRESHOLD: 500, // respawn quand orbes < seuil
  MAX_BOTS: 20, // nombre max de bots
};
