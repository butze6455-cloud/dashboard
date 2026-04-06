const express = require("express");
const multer = require("multer");
const { connectDB } = require("./database");

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🌐 HOME + STOCK + KEYS
app.get("/", async (req, res) => {
    const db = await connectDB();

    const tokens = await db.collection("stock").countDocuments({ type: "tokens", used: false });
    const cookies = await db.collection("stock").countDocuments({ type: "cookies", used: false });

    const keys = await db.collection("keys").find().toArray();

    res.send(`
    <html>
    <body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center">

    <h1>🚀 VaultAlts Dashboard</h1>

    <h2>📊 Live Stock</h2>
    🍪 Cookies: ${cookies}<br>
    🔑 Tokens: ${tokens}<br>

    <br><br>

    <h2>🔑 Key Liste</h2>
    <div style="max-width:800px;margin:auto;text-align:left;background:#111;padding:10px;border-radius:10px">
    ${keys.map(k => `
        <p>
        🔑 ${k.key} <br>
        Plan: ${k.plan} <br>
        User: ${k.user || "None"} <br>
        Status: ${k.used ? "Used" : "Free"}
        </p>
        <hr>
    `).join("")}
    </div>

    <br><br>

    <h2>📤 Upload Stock</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
        <select name="type">
            <option value="cookies">Cookies</option>
            <option value="tokens">Tokens</option>
        </select>
        <input type="file" name="file">
        <button>Upload</button>
    </form>

    </body>
    </html>
    `);
});

// 📦 Upload bleibt gleich
app.post("/upload", upload.single("file"), async (req, res) => {
    const db = await connectDB();

    const text = req.file.buffer.toString();

    await db.collection("stock").insertOne({
        type: req.body.type,
        data: text,
        used: false
    });

    res.redirect("/");
});

module.exports = app;
