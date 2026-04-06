const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

let db;

async function connectDB() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db("vaultalts");
        console.log("✅ MongoDB verbunden");
    } catch (err) {
        console.error("❌ Mongo Fehler:", err);
    }
}

function getDB() {
    if (!db) throw new Error("DB nicht verbunden!");
    return db;
}

module.exports = { connectDB, getDB };
