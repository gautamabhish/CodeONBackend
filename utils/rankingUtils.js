const Player = require("../models/player.js");
const LeaderboardStats = require("../models/LeaderboardStats.js");

// ✅ Increment player count for a platform (efficiently)
async function incrementPlayerCount(platform) {
  await LeaderboardStats.findOneAndUpdate(
    { platform },
    { $inc: { totalPlayers: 1 } }, // Increments count
    { upsert: true, new: true } // Creates entry if not exists
  );
}

// ✅ Get player rank within a specific platform (without full scan)
async function getPlayerRank(username, platform, score) {
  const rank = await Player.countDocuments({ platform, score: { $gt: score } }) + 1;
  const stats = await LeaderboardStats.findOne({ platform });
  const totalPlayers = stats ? stats.totalPlayers : 0;
  
  return { rank, totalPlayers };
}

module.exports = { incrementPlayerCount, getPlayerRank };
