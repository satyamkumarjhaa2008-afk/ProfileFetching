require('dotenv').config();
const express = require('express');
const fs = require("fs");
const multer = require("multer");
const { MongoClient } = require('mongodb');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static("public"));

// ===== MongoDB Atlas Connection =====

// ⚠️ Put these in .env ideally
const user = process.env.MONGO_USER || "";
const rawPassword = process.env.MONGO_PASS || "";
const encodedPass = encodeURIComponent(rawPassword);

// your DB names
const profileDB = "Profiles";
const photoDB = "Photos";

// 🔥 Atlas URI
const MONGO_URI = process.env.MONGO_URI ||
  `mongodb+srv://${user}:${encodedPass}@cluster0.g0yywja.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(MONGO_URI);

// collections
let collect;
let mollect;

// ===== Start Server =====
async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db(profileDB);
    collect = db.collection("People");

    const mb = client.db(photoDB);
    mollect = mb.collection("uploads");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

// ===== Multer Setup =====
const uploadDir = 'ProfilePic/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ===== Routes =====
app.get('/accounts', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'account.html'));
});

app.get('/thanku', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'thanku.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'signup.html'));
});

// ===== Get Profile =====
app.post("/getProfile", upload.none(), async (req, res) => {
  const userId = req.body.Id;

  try {
    const mrof = await mollect.findOne({ userId });
    const prof = await collect.findOne({ userId });

    if (prof) prof.picture = mrof;

    res.json(prof || {});
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// ===== Submit Form =====
app.post("/submitForm", upload.single('image'), async (req, res) => {
  try {
    const userData = JSON.parse(req.body.userData);

    const fileData = fs.readFileSync(req.file.path);

    const document = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      userId: userData.userId,
      size: req.file.size,
      data: fileData
    };

    await mollect.updateOne(
      { userId: userData.userId },
      { $set: document },
      { upsert: true }
    );

    await collect.updateOne(
      { userId: userData.userId },
      { $set: userData },
      { upsert: true }
    );

    res.json({ message: 'Data received successfully' });

    fs.unlink(req.file.path, err => {
      if (err) console.error("⚠️ Failed to delete temp file:", err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ===== Start =====
startServer();