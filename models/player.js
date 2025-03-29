const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true }, // Unique username/handle
  name: { type: String, required: false }, // Player's real name
  platform: { type: String, required: true, enum: ["GitHub", "LeetCode", "Codeforces"] }, // Platform
  score: { type: Number, required: true, default: 0 } // Score (generic for all platforms)
});

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;
