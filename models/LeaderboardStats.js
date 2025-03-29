const mongoose = require("mongoose");

const leaderboardStatsSchema = new mongoose.Schema({
  platform: { type: String, enum: ["GitHub", "LeetCode", "Codeforces"], unique: true },
  totalPlayers: { type: Number, default: 0 }
});

const LeaderboardStats = mongoose.model("LeaderboardStats", leaderboardStatsSchema);
module.exports = LeaderboardStats;
