const express = require('express')
const app = express()
const PORT = 3000
const multer = require("multer")
const { MongoClient } = require('mongodb')

const client = new MongoClient("mongodb://localhost:27017/");
let collect;
let mollect;
const upload = multer()

async function startServer() {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db('Profiles'); // Database name
    collect = db.collection('People'); // Collection name

    const mb = client.db("Photos")
mollect = mb.collection("uploads")
    // Start server after DB connection
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
app.get('/profile', (req, res) => {
  res.sendFile('/templates/index.html',{root:__dirname})
})
app.post("/upload", upload.none(), async (req, res) => {
  // `upload.none()` means we’re only receiving text fields, no files

  const userId = req.body.Id; // 👈 this is how you receive the FormData field

  console.log("User ID received from frontend:", userId);

  // you can now use this userId to query MongoDB, etc.
let prof = await collect.findOne({userId: userId})
let mrof = await mollect.findOne({userId: userId})
prof.picture = mrof
res.json(prof)



})
