const https = require("https");
https.get("https://api.ipify.org?format=json", (res) => {
  res.on("data", (chunk) => {
    console.log("This is the public IP your MongoDB client is using:", JSON.parse(chunk).ip);
  });
});
