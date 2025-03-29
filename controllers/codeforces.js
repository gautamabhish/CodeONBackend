const axios = require("axios");
const QRCode = require("qrcode");

// ✅ Fetch Codeforces Data
async function fetchCodeforcesData(username) {
  try {
    // Fetch user profile, contests, and submissions
    const [userInfo, userRating, userSubmissions] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`),
      axios.get(`https://codeforces.com/api/user.rating?handle=${username}`),
      axios.get(`https://codeforces.com/api/user.status?handle=${username}`)
    ]);

    const profile = userInfo.data.result[0];
    const contests = userRating.data.result;
    const submissions = userSubmissions.data.result;

    let solvedProblems = new Set();
    let difficultyCounts = { easy: 0, medium: 0, hard: 0 };

    // ✅ Categorize solved problems by difficulty
    submissions.forEach(submission => {
      if (submission.verdict === "OK") {
        solvedProblems.add(submission.problem.name);
        if (submission.problem.rating <= 1200) difficultyCounts.easy++;
        else if (submission.problem.rating <= 1800) difficultyCounts.medium++;
        else difficultyCounts.hard++;
      }
    });

    let totalSolved = solvedProblems.size;
    let maxSolvedCategory = Math.max(difficultyCounts.easy, difficultyCounts.medium, difficultyCounts.hard);
    let repetitionRatio = totalSolved > 0 ? maxSolvedCategory / totalSolved : 0;

    // ✅ Diversity Factor: Penalize too many "easy" problems
    let diversityFactor = 1;
    if (repetitionRatio > 0.5) {
      diversityFactor = 1 - (repetitionRatio - 0.5);
    }

    // ✅ Specialization Bonus: Reward medium/hard problem solvers
    let specializationBonus = 1;
    if (repetitionRatio > 0.5) {
      if (difficultyCounts.easy === maxSolvedCategory) {
        specializationBonus = 1 - (repetitionRatio - 0.5); // **Penalty** for too many easy problems
      } else {
        specializationBonus = 1 + (repetitionRatio - 0.5); // **Bonus** for medium/hard dominance
      }
    }

    // ✅ Score Calculation
    let contestScore = (profile.rating || 1000) / 10;
    let problemSolvingScore = totalSolved * 10 * diversityFactor;

    let finalScore = Math.round((problemSolvingScore * 0.6 + contestScore * 0.4) * specializationBonus);

    return {
      username: profile.handle,
      rating: profile.rating || "Unrated",
      maxRating: profile.maxRating || "N/A",
      contestsParticipated: contests.length,
      lastContest: contests.length > 0 ? contests[contests.length - 1].contestName : "None",
      totalSolved,
      difficultyStats: difficultyCounts,
      diversityFactor: diversityFactor.toFixed(2),
      specializationBonus: specializationBonus.toFixed(2),
      finalProfileScore: finalScore
    };

  } catch (error) {
    console.error("Error fetching Codeforces data:", error.message);
    return { error: "Failed to fetch Codeforces data" };
  }
}

// ✅ Controller Function with QR Code Generation
const getCodeforcesUser = async (req, res) => {
  const username = req.params.username;

  if (username === "favicon.ico") return res.status(204).end();

  const codeforcesData = await fetchCodeforcesData(username);

  if (codeforcesData.error) {
    return res.status(500).json(codeforcesData);
  }

  try {
    // ✅ Generate QR Code with user data
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(codeforcesData));

    // ✅ Attach QR Code to response
    res.json({ ...codeforcesData, qrCode: qrCodeData });
  } catch (qrError) {
    console.error("QR Code generation failed:", qrError);
    res.status(500).json({ error: "Failed to generate QR Code" });
  }
};

module.exports = { getCodeforcesUser };
