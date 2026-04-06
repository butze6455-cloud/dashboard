require("./index");

const app = require("./dashboard");

const PORT = process.env.PORT || 10000;

// 🔥 verhindert doppelt starten (Render fix)
if (!global.serverStarted) {
    app.listen(PORT, () => {
        console.log("🌐 Dashboard läuft auf Port " + PORT);
    });

    global.serverStarted = true;
}
