const express = require("express");
const multer = require("multer");
const { connectDB } = require("./database");

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));

function page(c) {
    return `<body style="background:#111;color:white;text-align:center;font-family:sans-serif">${c}</body>`;
}

app.get("/", async (req, res) => {
    const db = await connectDB();

    const keys = await db.collection("keys").countDocuments();
    const tokens = await db.collection("stock").countDocuments({ type: "tokens" });
    const cookies = await db.collection("stock").countDocuments({ type: "cookies" });

    res.send(page(`
    <h1>Dashboard</h1>
    Keys: ${keys}<br>Tokens: ${tokens}<br>Cookies: ${cookies}<br><br>

    <form action="/upload" method="post" enctype="multipart/form-data">
        <select name="type">
            <option value="cookies">Cookies</option>
            <option value="tokens">Tokens</option>
        </select>
        <input type="file" name="file">
        <button>Upload</button>
    </form>
    <br><a href="/keys">Keys</a>
    `));
});

app.post("/upload", upload.single("file"), async (req, res) => {
    const db = await connectDB();

    const text = req.file.buffer.toString();
    const lines = text.split("\n").filter(x => x);

    await db.collection("stock").insertMany(
        lines.map(l => ({ type: req.body.type, data: l, used: false }))
    );

    res.redirect("/");
});

app.get("/keys", async (req, res) => {
    const db = await connectDB();
    const keys = await db.collection("keys").find().toArray();

    res.send(page(keys.map(k =>
        `${k.key} | ${k.plan} | ${k.user || "None"}`
    ).join("<br>")));
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Dashboard läuft");
});
