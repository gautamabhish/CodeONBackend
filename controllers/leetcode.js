const axios = require("axios");
const QRCode = require("qrcode");
const Player = require("../models/player.js");
const { incrementPlayerCount, getPlayerRank } = require("../utils/rankingUtils.js");

async function fetchLeetCodeData(username) {
    try {
      const query = {
        query: `
          query getUserProfileStats($username: String!) {
            matchedUser(username: $username) {
              username
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                  submissions
                }
              }
            }
            userContestRanking(username: $username) {
              rating
            }
          }
        `,
        variables: { username }
      };
  
      const response = await axios.post(`https://leetcode.com/graphql`, query, { headers: { "Content-Type": "application/json" } });
  
      if (response.data.errors) {
          console.error("GraphQL Errors:", response.data.errors);
          return { error: "Query error", details: response.data.errors };
      }
  
      const user = response.data.data.matchedUser;
      const contestRanking = response.data.data.userContestRanking;
  
      if (!user) {
          return { error: "User not found" };
      }
  
      let totalSolved = 0;
      let totalDifficultyScore = 0;
      let difficultyStats = [];
  
      // Assign weights to difficulties
      const difficultyWeights = {
          "Easy": 1,
          "Medium": 2,
          "Hard": 3
      };
  
      if (user.submitStats && user.submitStats.acSubmissionNum) {
          user.submitStats.acSubmissionNum.forEach(entry => {
              const solved = entry.count;
              const attempts = entry.submissions;
  
              if (attempts === 0) return;
  
              totalSolved += solved;
              const accuracy = (solved / attempts) * 100;
              const weight = difficultyWeights[entry.difficulty] || 1;
              const diffScore = solved * weight * (accuracy / 100);
              totalDifficultyScore += diffScore;
  
              difficultyStats.push({
                  difficulty: entry.difficulty,
                  solved,
                  attempts,
                  accuracy: parseFloat(accuracy.toFixed(2)),
                  weight,
                  diffScore: parseFloat(diffScore.toFixed(2))
              });
          });
      }
  
      // 🔹 Diversity Factor Calculation
      let maxSolvedForDiff = Math.max(...difficultyStats.map(stat => stat.solved), 0);
      const repetitionRatio = totalSolved ? (maxSolvedForDiff / totalSolved) : 0;
      let diversityFactor = repetitionRatio > 0.5 ? 1 - (repetitionRatio - 0.5) : 1;
  
      // 🔹 Specialization Bonus/Penalty
      let specializationBonus = 1;
      if (totalSolved > 0 && repetitionRatio > 0.5) {
          const dominantStat = difficultyStats.find(stat => stat.solved === maxSolvedForDiff);
          if (dominantStat) {
              const excessRatio = repetitionRatio - 0.5;
              specializationBonus = dominantStat.difficulty === "Easy" ? 1 - excessRatio : 1 + excessRatio;
          }
      }
  
      // 🔹 Score Calculation
      const problemSolvingScore = totalDifficultyScore * diversityFactor;
      const contestScore = contestRanking?.rating ? contestRanking.rating / 10 : 0;
      const combinedScore = problemSolvingScore * 0.7 + contestScore * 0.3;
      const overallScore = Math.round(combinedScore * specializationBonus);
  
      // ✅ Store player data
      const existingPlayer = await Player.findOne({ playerId: username, platform: "LeetCode" });
      if (!existingPlayer) await incrementPlayerCount("LeetCode");
  
      const player = await Player.findOneAndUpdate(
        { playerId: username, platform: "LeetCode" },
        { name: username, platform: "LeetCode", score: overallScore },
        { upsert: true, new: true }
      );
  
      // ✅ Get rank & total players
      const ranking = await getPlayerRank(username, "LeetCode", overallScore);
  
      return { 
        player,
        ranking,
        problemSolvingScore: Math.round(problemSolvingScore),  // Include problem-solving score
        overallScore  // Include overall score
      };
    } catch (error) {
      console.error("Error fetching LeetCode data:", error.message);
      return { error: "Failed to fetch LeetCode data." };
    }
  }
  
async function getLeetCodeProfile(req, res) {
  const username = req.params.username;
  const data = await fetchLeetCodeData(username);

  if (data.error) return res.status(500).json(data);

  try {
    const qrCodeData = await QRCode.toDataURL(`https://leetcode.com/${username}`);
    res.json({ ...data, qrCode: qrCodeData });
  } catch (qrError) {
    console.error("QR Code generation failed:", qrError);
    res.status(500).json({ error: "Failed to generate QR Code" });
  }
}

module.exports = { getLeetCodeProfile };
