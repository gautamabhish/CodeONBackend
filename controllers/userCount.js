const LeaderboardStats = require("../models/LeaderboardStats");

const getTotalUserCount = async (req, res) => {
  try {
    const result = await LeaderboardStats.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: "$totalPlayers" } // Summing up all platform users
        }
      }
    ]);

    // Extract totalUsers properly
    const totalUsers = result.length > 0 ? result[0].totalUsers : 0;

    res.status(200).json({ totalUsers });
  } catch (error) {
    console.error("Error fetching total user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getTotalUserCount };
