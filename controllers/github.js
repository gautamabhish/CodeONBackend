const axios = require("axios");
const QRCode = require("qrcode");
require("dotenv").config();

async function fetchGitHubData(username) {
    try {
        const headers = { Authorization: `Bearer ${process.env.TOKEN}` };
        let userData = {};
        let reposData = [];
        let gistsData = [];
        let eventsData = [];

        // Fetch User Profile
        const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers });
        userData = userResponse.data;

        // Fetch Repositories
        const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, { headers });
        reposData = reposResponse.data;

        // Fetch Public Gists
        const gistsResponse = await axios.get(`https://api.github.com/users/${username}/gists`, { headers });
        gistsData = gistsResponse.data;

        // Fetch Public Events
        try {
            const eventsResponse = await axios.get(`https://api.github.com/users/${username}/events/public`, { headers });
            eventsData = eventsResponse.data;
        } catch (err) {
            console.warn("⚠️ Failed to fetch user events.");
        }

        // 🔹 Analyze Repositories
        const repoCount = reposData.length;
        let languageSet = new Set();
        let totalStars = 0;
        let totalForks = 0;
        let forkedRepos = 0;
        let totalIssuesOpened = 0;
        let totalIssuesClosed = 0;
        let totalPRsMerged = 0;
        let contributionsToTopRepos = 0;

        // Top 3 Starred Repos
        const topRepos = reposData
            .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
            .slice(0, 3)
            .map(repo => {
                totalStars += repo.stargazers_count || 0;
                totalForks += repo.forks_count || 0;
                if (repo.language) languageSet.add(repo.language);
                if (repo.fork) forkedRepos++;

                return {
                    name: repo.name,
                    stars: repo.stargazers_count || 0,
                    forks: repo.forks_count || 0,
                    url: repo.html_url
                };
            });

        // Analyze Events
        eventsData.forEach(event => {
            if (event.type === "IssuesEvent" && event.payload.action === "opened") totalIssuesOpened++;
            if (event.type === "IssuesEvent" && event.payload.action === "closed") totalIssuesClosed++;
            if (event.type === "PullRequestEvent" && event.payload.action === "closed" && event.payload.pull_request.merged) {
                totalPRsMerged++;
            }
        });

        // Contribution to Top Repos
        for (let repo of topRepos) {
            try {
                const contributorsResponse = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/contributors`, { headers });
                const contributors = contributorsResponse.data;

                if (contributors.some(contributor => contributor.login === username)) {
                    contributionsToTopRepos += 50;
                }
            } catch (err) {
                console.warn(`⚠️ Failed to check contributions for ${repo.name}`);
            }
        }

        // Account Age
        const accountAge = new Date().getFullYear() - new Date(userData.created_at).getFullYear();
        const uniqueLanguages = languageSet.size;

        // 🏆 GitHub Score Calculation
        let totalScore =
            (repoCount * 2 > 100 ? 100 : repoCount * 2) +
            (forkedRepos * 1 > 50 ? 50 : forkedRepos * 1) +
            (totalStars * 5 > 500 ? 500 : totalStars * 5) +
            (totalForks * 3 > 300 ? 300 : totalForks * 3) +
            (totalIssuesOpened * 2 > 100 ? 100 : totalIssuesOpened * 2) +
            (totalIssuesClosed * 3 > 150 ? 150 : totalIssuesClosed * 3) +
            (totalPRsMerged * 10 > 500 ? 500 : totalPRsMerged * 10) +
            (userData.followers * 3 > 500 ? 500 : userData.followers * 3) +
            (accountAge * 5 > 50 ? 50 : accountAge * 5) +
            (uniqueLanguages * 5 > 100 ? 100 : uniqueLanguages * 5) +
            (contributionsToTopRepos > 500 ? 500 : contributionsToTopRepos);

        return {
            profile: {
                name: userData.name || null,
                bio: userData.bio || null,
                email: userData.email || null
            },
            account_stats: {
                total_public_repos: userData.public_repos,
                total_public_gists: gistsData.length,
                followers: userData.followers,
                following: userData.following,
                account_created_at: userData.created_at,
                total_issues_opened: totalIssuesOpened,
                total_issues_closed: totalIssuesClosed,
                total_prs_merged: totalPRsMerged
            },
            repository_analysis: {
                total_repositories: repoCount,
                total_stars: totalStars,
                programming_languages_used: [...languageSet],
                top_3_starred_repositories: topRepos
            },
            github_score: totalScore
        };
    } catch (error) {
        console.error("Error fetching GitHub data:", error.response ? error.response.data : error.message);
        return { error: "Failed to fetch GitHub data." };
    }
}

// ✅ Controller Function with QR Code
async function getGitHubProfile(req, res) {
    const username = req.params.username;
    const data = await fetchGitHubData(username);

    if (data.error) {
        return res.status(500).json(data);
    }

    try {
        // ✅ Generate QR Code with user data
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(data));

        // ✅ Attach QR Code to response
        res.json({ ...data, qrCode: qrCodeData });
    } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
        res.status(500).json({ error: "Failed to generate QR Code" });
    }
}

module.exports = { getGitHubProfile };
