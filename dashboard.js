const express = require("express");
const multer = require("multer");
const { connectDB } = require("./database");

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", async (req, res) => {
    const db = await connectDB();

    const tokens = await db.collection("stock").countDocuments({ type: "tokens", used: false });
    const cookies = await db.collection("stock").countDocuments({ type: "cookies", used: false });

    res.send(`
    <html>
    <body style="background:#0f172a;color:white;text-align:center;font-family:sans-serif">
    <h1>🚀 Dashboard</h1>

    <h2>📊 Live Stock</h2>
    🍪 Cookies: ${cookies}<br>
    🔑 Tokens: ${tokens}<br>

    <br><br>

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
