const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 6969;

app.use(cors());
app.use(express.json());

const {getCodeforcesUser} = require('./controllers/codeforces.js');
const {getGitHubProfile} = require('./controllers/github.js');
const {getLeetCodeProfile} = require('./controllers/leetcode.js')
// const {generateQRMiddleware} = require('./middlewares/qr.js')



app.get('/github/:username',getGitHubProfile)
app.get('/leetcode/:username',getLeetCodeProfile)
app.get('/codeforces/:username',getCodeforcesUser)


app.listen(PORT , ()=>{
    console.log('running...',PORT);
})