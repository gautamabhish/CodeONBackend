const axios = require("axios");
const QRCode = require("qrcode");
const Player = require("../models/player.js");
const { incrementPlayerCount, getPlayerRank } = require("../utils/rankingUtils.js");
require("dotenv").config();
const getCardColor = require('../utils/colorDecider.js')
async function fetchGitHubData(username) {
    try {
        const headers = { Authorization: `Bearer ${process.env.TOKEN}` };

        // Fetch Profile, Repos, Gists, Events
        const [userResponse, reposResponse, gistsResponse, eventsResponse] = await Promise.all([
            axios.get(`https://api.github.com/users/${username}`, { headers }),
            axios.get(`https://api.github.com/users/${username}/repos`, { headers }),
            axios.get(`https://api.github.com/users/${username}/gists`, { headers }),
            axios.get(`https://api.github.com/users/${username}/events/public`, { headers }).catch(() => ({ data: [] }))
        ]);

        const userData = userResponse.data;
        const reposData = reposResponse.data;
        const gistsData = gistsResponse.data;
        const eventsData = eventsResponse.data || [];

        // 🔹 Analyze Repositories
        const repoCount = reposData.length;
        let languageSet = new Set();
        let totalStars = 0, totalForks = 0, forkedRepos = 0;
        let totalIssuesOpened = 0, totalIssuesClosed = 0, totalPRsMerged = 0, contributionsToTopRepos = 0;

        // Top 3 Starred Repos
        const topRepos = reposData
            .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
            .slice(0, 3)
            .map(repo => {
                totalStars += repo.stargazers_count || 0;
                totalForks += repo.forks_count || 0;
                if (repo.language) languageSet.add(repo.language);
                if (repo.fork) forkedRepos++;
                return { name: repo.name, stars: repo.stargazers_count, forks: repo.forks_count, url: repo.html_url };
            });

        // Analyze Events
        eventsData.forEach(event => {
            if (event.type === "IssuesEvent" && event.payload.action === "opened") totalIssuesOpened++;
            if (event.type === "IssuesEvent" && event.payload.action === "closed") totalIssuesClosed++;
            if (event.type === "PullRequestEvent" && event.payload.action === "closed" && event.payload.pull_request.merged) totalPRsMerged++;
        });

        // Contribution to Top Repos
        for (let repo of topRepos) {
            try {
                const contributorsResponse = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/contributors`, { headers });
                if (contributorsResponse.data.some(contributor => contributor.login === username)) {
                    contributionsToTopRepos += 50;
                }
            } catch (err) {}
        }

        // Account Age
        const accountAge = new Date().getFullYear() - new Date(userData.created_at).getFullYear();
        const uniqueLanguages = languageSet.size;

        // 🎯 **GitHub Problem-Solving Score**
        const problemSolvingScore = 
            (totalIssuesOpened * 2) + 
            (totalIssuesClosed * 3) + 
            (totalPRsMerged * 10) +
            (totalStars * 5) + 
            (totalForks * 3);

        // 🎯 **Overall Score Calculation** (Weighted)
        const overallScore = Math.round(
            (problemSolvingScore * 0.7) +  // 70% weight to problem-solving
            (userData.followers * 3) +      // Engagement boost
            (contributionsToTopRepos) +    // Contributions to top repos
            (accountAge * 5) +             // Account longevity
            (uniqueLanguages * 5)          // Multilingual diversity
        );

        // ✅ Store Player in MongoDB
        const existingPlayer = await Player.findOne({ playerId: username, platform: "GitHub" });
        if (!existingPlayer) await incrementPlayerCount("GitHub");

        const player = await Player.findOneAndUpdate(
            { playerId: username, platform: "GitHub" },
            { name: username, platform: "GitHub", score: overallScore },
            { upsert: true, new: true }
        );

        // ✅ Get Rank & Total Players
        const ranking = await getPlayerRank( "GitHub", overallScore);

        return { 
            player,
            problemSolvingScore: Math.round(problemSolvingScore),  // Separate problem-solving score
            overallScore,  // Final GitHub score
            ranking
        };

    } catch (error) {
        console.error("Error fetching GitHub data:", error.message);
        return { error: "Failed to fetch GitHub data." };
    }
}

// ✅ Controller Function to Get GitHub Profile
async function getGitHubProfile(req, res) {
    const username = req.params.username;
    const data = await fetchGitHubData(username);

    if (data.error) return res.status(500).json(data);

    try {
        const {gradient , firstColor} = getCardColor(data.ranking.rank,data.ranking.totalPlayers);
        const qrCodeData = await QRCode.toDataURL(`https://github.com/${username}`,{
            color: {
              dark:firstColor ,  // QR code color (black)
              light: "#00000000" // Transparent background
            }
          });
        res.json({ ...data, qrCode: qrCodeData ,color:gradient});
    } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
        res.status(500).json({ error: "Failed to generate QR Code" });
    }
}

module.exports = { getGitHubProfile };
