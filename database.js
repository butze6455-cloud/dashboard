const { MongoClient } = require("mongodb");

// 👉 Render ENV Variable wird benutzt
const client = new MongoClient(process.env.MONGO_URI);

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
