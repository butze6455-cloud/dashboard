const express = require("express");
const multer = require("multer");
const { connectDB } = require("./database");

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function page(content) {
    return `
    <html>
    <head>
        <title>Dashboard</title>
        <style>
            body { background:#0d0d0d; color:white; font-family:sans-serif; text-align:center; }
            .box { background:#1a1a1a; padding:20px; margin:20px auto; width:80%; border-radius:10px; }
            button { padding:10px; margin:5px; background:#333; color:white; border:none; border-radius:5px; }
        </style>
    </head>
    <body>
        <h1>🚀 Dashboard</h1>
        ${content}
    </body>
    </html>
    `;
}

// HOME
app.get("/", async (req, res) => {
    const db = await connectDB();

    const keys = await db.collection("keys").countDocuments();
    const tokens = await db.collection("stock").countDocuments({ type: "tokens" });
    const cookies = await db.collection("stock").countDocuments({ type: "cookies" });

    res.send(page(`
        <div class="box">
            Keys: ${keys}<br>
            Tokens: ${tokens}<br>
            Cookies: ${cookies}
        </div>

        <div class="box">
            <form action="/upload" method="post" enctype="multipart/form-data">
                <select name="type">
                    <option value="cookies">Cookies</option>
                    <option value="tokens">Tokens</option>
                </select><br>
                <input type="file" name="file" required><br>
                <button>Upload</button>
            </form>
        </div>

        <a href="/keys"><button>Keys</button></a>
    `));
});

// UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
    const db = await connectDB();

    const text = req.file.buffer.toString();
    const lines = text.split("\n").filter(x => x.trim() !== "");

    await db.collection("stock").insertMany(
        lines.map(l => ({ type: req.body.type, data: l, used: false }))
    );

    res.redirect("/");
});

// KEYS
app.get("/keys", async (req, res) => {
    const db = await connectDB();
    const keys = await db.collection("keys").find().toArray();

    res.send(page(
        keys.map(k => `
            <div class="box">
                ${k.key}<br>
                ${k.plan}<br>
                User: ${k.user || "None"}
                <form action="/delete" method="post">
                    <input type="hidden" name="key" value="${k.key}">
                    <button>Delete</button>
                </form>
            </div>
        `).join("") + `<a href="/"><button>Back</button></a>`
    ));
});

// DELETE
app.post("/delete", async (req, res) => {
    const db = await connectDB();
    await db.collection("keys").deleteOne({ key: req.body.key });
    res.redirect("/keys");
});

// ❗ KEIN app.listen HIER
module.exports = app;
