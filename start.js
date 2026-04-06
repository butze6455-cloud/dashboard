require("./index");

// 🌐 Dashboard nur starten wenn Render PORT existiert
if (process.env.PORT) {
    require("./dashboard");
}
