const Player = require("../models/player.js");
const LeaderboardStats = require("../models/LeaderboardStats.js");

// 🎯 Define stricter percentile-based thresholds
const GOLD_PERCENTILE = 0.02;  // Top 2% get Gold
const SILVER_PERCENTILE = 0.20; // Top 20% (including Gold) get Silver

// ✅ Increment player count for a platform
async function incrementPlayerCount(platform) {
  await LeaderboardStats.findOneAndUpdate(
    { platform },
    { $inc: { totalPlayers: 1 } },
    { upsert: true, new: true }
  );
}

// ✅ Get player rank and category (stricter)
async function getPlayerRank( platform, score) {
  // Get total players in platform
  const stats = await LeaderboardStats.findOne({ platform });
  const totalPlayers = stats ? stats.totalPlayers : 0;
  
  if (totalPlayers === 0) {
    return { rank: 1, totalPlayers: 1, category: "Normal" }; // Default case
  }

  // Get player's rank (players with higher scores + 1)
  const rank = await Player.countDocuments({ platform, score: { $gt: score } }) + 1;

  // Calculate percentile
  const percentile = rank / totalPlayers;

  // 🎖 Determine player category based on stricter relative distribution
  let category = "Normal"; // Default
  if (percentile <= GOLD_PERCENTILE) {
    category = "Gold";
  } else if (percentile <= SILVER_PERCENTILE) {
    category = "Silver";
  }

  return { rank, totalPlayers };
}

module.exports = { incrementPlayerCount, getPlayerRank };
