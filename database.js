const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);
let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("vaultalts");
        console.log("✅ MongoDB verbunden");
    }
    return db;
}

module.exports = { connectDB };
