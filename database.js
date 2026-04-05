const { MongoClient } = require("mongodb");

// 👉 HIER DEIN MONGO LINK REIN (WICHTIG: MIT "")
const MONGO_URI = 

const client = new MongoClient(MONGO_URI); "mongodb+srv://butze6455_db_user:OvthYec6q5ZsUzZo@cluster0.3abvojv.mongodb.net/?appName=Cluster0";

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("vaultalts");
        console.log("✅ MongoDB verbunden");
    } catch (err) {
        console.error("❌ Mongo Fehler:", err);
    }
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };
