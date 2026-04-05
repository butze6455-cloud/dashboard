require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { connectDB, getDB } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

async function startServer() {
    await connectDB();

    app.get("/", async (req, res) => {
        const db = getDB();

        const tokenCount = await db.collection("stock").countDocuments({ type: "token" });
        const cookieCount = await db.collection("stock").countDocuments({ type: "cookie" });

        res.send(`
        <h1>🖤 VaultAlts Dashboard</h1>
        <p>Token: ${tokenCount}</p>
        <p>Cookie: ${cookieCount}</p>

        <form method="POST" action="/upload" enctype="multipart/form-data">
            <select name="type">
                <option value="token">Token</option>
                <option value="cookie">Cookie</option>
            </select>
            <input type="file" name="files" multiple>
            <button>Upload</button>
        </form>
        `);
    });

    app.post("/upload", upload.array("files", 10), async (req, res) => {
        const db = getDB();

        for (const file of req.files) {
            const content = fs.readFileSync(file.path, "utf-8");

            await db.collection("stock").insertOne({
                type: req.body.type,
                value: content
            });

            fs.unlinkSync(file.path);
        }

        res.redirect("/");
    });

    app.listen(PORT, () => {
        console.log("🌐 Dashboard läuft");
    });
}

startServer();
