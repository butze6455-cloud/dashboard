require("./index");

const app = require("./dashboard");

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🌐 Dashboard läuft auf Port " + PORT);
});
