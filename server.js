//Impoting Modules

const express = require('express');
const fs = require("fs")
const multer = require("multer");
const { MongoClient } = require('mongodb');


const app = express();
const PORT = 3000;

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static("public"));

//defining Variables
let mollect;
let collect;

const client = new MongoClient("mongodb://localhost:27017/");

//Server Starting.................

async function startServer() {
  try {
     console.log("✅ Connected to MongoDB");
    await client.connect();
   
//connecting to databases
    const db = client.db('Profiles');
    collect = db.collection('People');

    const mb = client.db("Photos");
    mollect = mb.collection("uploads");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

// Ensure uploads folder exists (Since we are converting image into Base64 in server side so we have to firstly save it in the backend later we can delete it/ there can be a direct approach too)
const uploadDir = 'ProfilePic/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

//End points (Get)

app.get('/accounts', (req, res) => {
  res.sendFile('/templates/account.html', { root: __dirname });
});
app.get('/thanku', (req, res) => {
  res.sendFile('/templates/thanku.html', { root: __dirname });
});

app.get('/signin', (req, res) => {
  res.sendFile('/templates/index.html', { root: __dirname })
  ;
});

app.get('/signup', (req, res) => {
  res.sendFile('/templates/signup.html', { root: __dirname });
});
//// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });

//End Points (Posts,Runs when a person searches its profile)
app.post("/getProfile", upload.none(), async (req, res) => {
  const userId = req.body.Id;
  console.log("📨 User ID received:");

   try {

    let mrof = await mollect.findOne({userId: userId})

    const prof = await collect.findOne({ userId: userId });
    prof.picture = mrof
    console.log("🔍 Query result:", prof);
    res.json(prof || {});
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: "Database query failed" });
  }
  

 
});

//Post(for submitting form)

app.post("/submitForm", upload.single('image'), async (req, res) => {


  console.log(req.file);   // file info (buffer, mimetype,image etc.)

  // 🔹 Access text fields
  const userData = JSON.parse(req.body.userData);
  console.log(userData);

const fileData = fs.readFileSync(req.file.path);
        // Prepare document for MongoDB
        const document = {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            userId :userData.userId,
            size: req.file.size,
            data: fileData
        };
await mollect.updateOne({ userId: userData.userId }, { $set: document }, { upsert: true });
await collect.updateOne({ userId: userData.userId }, { $set: userData }, { upsert: true });

 res.json({ message: 'Data received successfully' });
 //deleting the photo once uploaded in database
 fs.unlink(req.file.path, (err) => {
    if (err) console.error("⚠️ Failed to delete temp file:", err);
});

 
});


 

  
startServer();
