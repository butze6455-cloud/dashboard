const { MongoClient } = require("mongodb");

// 👉 HIER DEIN MONGO LINK EINTRAGEN
const MONGO_URI = "DEIN_MONGO_LINK";

const client = new MongoClient(mongodb+srv://butze6455_db_user:OvthYec6q5ZsUzZo@cluster0.3abvojv.mongodb.net/?appName=Cluster0);
let db;

async function connectDB() {
    await client.connect();
    db = client.db("vaultalts");
    console.log("✅ MongoDB verbunden");
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };
