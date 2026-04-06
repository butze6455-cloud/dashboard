const express = require("express");
const multer = require("multer");
const { connectDB } = require("./database");

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🎨 DARK UI
function page(content) {
    return `
    <html>
    <head>
    <title>VaultAlts Dashboard</title>
    <style>
    body { background:#0d0d0d; color:white; font-family:sans-serif; text-align:center; }
    .box { background:#1a1a1a; padding:20px; margin:20px auto; width:80%; border-radius:10px; }
    button { padding:10px; margin:5px; border:none; border-radius:5px; background:#333; color:white; cursor:pointer; }
    button:hover { background:#555; }
    input { padding:10px; margin:5px; border-radius:5px; border:none; }
    </style>
    </head>
    <body>
    <h1>🚀 VaultAlts Admin Panel</h1>
    ${content}
    </body>
    </html>
    `;
}

// 📊 HOME
app.get("/", async (req, res) => {
    const db = await connectDB();

    const keys = await db.collection("keys").countDocuments();
    const tokens = await db.collection("stock").countDocuments({ type: "tokens" });
    const cookies = await db.collection("stock").countDocuments({ type: "cookies" });

    res.send(page(`
    <div class="box">
        <h2>📊 Stats</h2>
        Keys: ${keys}<br>
        Tokens: ${tokens}<br>
        Cookies: ${cookies}
    </div>

    <div class="box">
        <h2>📦 Upload Stock</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <select name="type">
                <option value="cookies">Cookies</option>
                <option value="tokens">Tokens</option>
            </select><br>
            <input type="file" name="file" required><br>
            <button type="submit">Upload</button>
        </form>
    </div>

    <div class="box">
        <h2>🔑 Keys</h2>
        <a href="/keys"><button>Keys anzeigen</button></a>
    </div>
    `));
});

// 📦 UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
    const db = await connectDB();

    const type = req.body.type;
    const text = req.file.buffer.toString();

    const lines = text.split("\n").filter(l => l.trim() !== "");

    const docs = lines.map(line => ({
        type,
        data: line,
        used: false,
        date: new Date()
    }));

    await db.collection("stock").insertMany(docs);

    res.send(page(`<h2>✅ ${lines.length} ${type} hochgeladen</h2><a href="/"><button>Zurück</button></a>`));
});

// 🔑 KEYS LIST
app.get("/keys", async (req, res) => {
    const db = await connectDB();

    const keys = await db.collection("keys").find().toArray();

    let html = keys.map(k => `
        <div class="box">
            🔑 ${k.key}<br>
            Plan: ${k.plan}<br>
            User: ${k.user || "None"}<br>
            <form action="/deleteKey" method="post">
                <input type="hidden" name="key" value="${k.key}">
                <button>🗑 Delete</button>
            </form>
        </div>
    `).join("");

    res.send(page(html + `<a href="/"><button>Zurück</button></a>`));
});

// 🗑 DELETE KEY
app.post("/deleteKey", async (req, res) => {
    const db = await connectDB();

    await db.collection("keys").deleteOne({ key: req.body.key });

    res.redirect("/keys");
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🌐 Dashboard läuft auf Port " + PORT);
});
