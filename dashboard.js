const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

// ===== LOAD =====
function loadKeys() {
    if (!fs.existsSync("keys.json")) {
        fs.writeFileSync("keys.json", JSON.stringify({ keys: [], users: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync("keys.json"));
}

function saveKeys(data) {
    fs.writeFileSync("keys.json", JSON.stringify(data, null, 2));
}

function loadStock() {
    if (!fs.existsSync("stock.json")) {
        fs.writeFileSync("stock.json", JSON.stringify({ token: [], cookie: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync("stock.json"));
}

function saveStock(data) {
    fs.writeFileSync("stock.json", JSON.stringify(data, null, 2));
}

// ===== HOME =====
app.get("/", (req, res) => {

    const keys = loadKeys();
    const stock = loadStock();

    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>VaultAlts Dashboard</title>

<style>
body {
    background: #050505;
    color: #e5e5e5;
    font-family: Arial;
    padding: 20px;
}

h1 {
    color: white;
}

.card {
    background: #0d0d0d;
    border: 1px solid #1f1f1f;
    padding: 20px;
    border-radius: 14px;
    margin-bottom: 20px;
}

button {
    background: #1a1a1a;
    color: white;
    border: 1px solid #2a2a2a;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}

button:hover {
    background: #2a2a2a;
}

.delete-btn {
    background: #220000;
    border: 1px solid #440000;
}

.delete-btn:hover {
    background: #440000;
}

select, input {
    background: #111;
    color: white;
    border: 1px solid #2a2a2a;
    padding: 6px;
    border-radius: 6px;
    margin-right: 5px;
}

.key {
    display: flex;
    justify-content: space-between;
    background: #0a0a0a;
    border: 1px solid #1f1f1f;
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 10px;
}

.green {
    color: #22c55e;
}

.red {
    color: #ef4444;
}
</style>

</head>
<body>

<h1>🖤 VaultAlts Dashboard</h1>

<div class="card">
    <h2>📊 Stock</h2>
    <p>Token: <b>${stock.token.length}</b></p>
    <p>Cookie: <b>${stock.cookie.length}</b></p>
</div>

<div class="card">
    <h2>📥 Upload Stock</h2>
    <form method="POST" action="/upload" enctype="multipart/form-data">
        <select name="type">
            <option value="token">Token</option>
            <option value="cookie">Cookie</option>
        </select>
        <input type="file" name="files" multiple>
        <button>Upload</button>
    </form>
</div>

<div class="card">
    <h2>🔑 Keys</h2>

    ${keys.keys.map(k => `
    <div class="key">
        <div>
            <b>${k.key}</b><br>
            <span class="${k.usedBy ? 'red' : 'green'}">
                ${k.usedBy ? "Benutzt" : "Frei"}
            </span><br>
            👤 ${k.usedBy ? k.usedBy : "Keiner"}
        </div>

        <form method="POST" action="/delete">
            <input type="hidden" name="key" value="${k.key}">
            <button class="delete-btn">🗑</button>
        </form>
    </div>
    `).join("")}

</div>

<div class="card">
    <h2>➕ Key erstellen</h2>
    <form method="POST" action="/create">
        <select name="plan">
            <option value="month">1 Monat</option>
            <option value="year">1 Jahr</option>
        </select>
        <button>Erstellen</button>
    </form>
</div>

</body>
</html>
`);
});

// ===== CREATE KEY =====
app.post("/create", (req, res) => {

    const plan = req.body.plan;
    let duration = plan === "month" ? 30 : 365;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "VaultAlts-";

    for (let i = 0; i < 8; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }

    let data = loadKeys();

    data.keys.push({
        key,
        expires: Date.now() + duration * 86400000,
        usedBy: null
    });

    saveKeys(data);

    res.redirect("/");
});

// ===== DELETE KEY =====
app.post("/delete", (req, res) => {

    const keyInput = req.body.key;
    let data = loadKeys();

    const index = data.keys.findIndex(k => k.key === keyInput);

    if (index !== -1) {

        const keyData = data.keys[index];

        if (keyData.usedBy && data.users[keyData.usedBy]) {
            delete data.users[keyData.usedBy];
        }

        data.keys.splice(index, 1);
        saveKeys(data);
    }

    res.redirect("/");
});

// ===== UPLOAD STOCK =====
app.post("/upload", upload.array("files", 10), (req, res) => {

    const type = req.body.type;
    let db = loadStock();

    req.files.forEach(file => {
        const content = fs.readFileSync(file.path, "utf-8");
        db[type].push(content);
        fs.unlinkSync(file.path);
    });

    saveStock(db);

    res.redirect("/");
});

// ===== START =====
app.listen(PORT, () => {
    console.log("🌐 Dashboard läuft auf Port " + PORT);
});
