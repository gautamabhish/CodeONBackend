const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  

})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

const app = express();
const PORT = process.env.PORT || 6969;

const whitelist = ["https://code-on-one.vercel.app","https://abhishek-gautam-dev.vercel.app"]
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },// Ensure it's a string, not an array
  methods: "GET, POST, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true, // Allow cookies if needed
};
app.use(cors(corsOptions));

app.use(express.json());

const {getCodeforcesUser} = require('./controllers/codeforces.js');
const {getGitHubProfile} = require('./controllers/github.js');
const {getLeetCodeProfile} = require('./controllers/leetcode.js')
// const {generateQRMiddleware} = require('./middlewares/qr.js')
const {getTotalUserCount} = require('./controllers/userCount.js')
 

app.get('/github/:username',getGitHubProfile)
app.get('/leetcode/:username',getLeetCodeProfile)
app.get('/codeforces/:username',getCodeforcesUser)
app.get('/userCount' ,getTotalUserCount)

app.listen(PORT , ()=>{
    console.log('running...',PORT);
})
