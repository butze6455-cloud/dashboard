// 🔒 SICHERE VERSION: Discord Bot + Express Server (Render-ready)

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

console.log("🚀 Start...");

require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// ===== TOKEN CHECK =====
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN fehlt!");
} else {
  console.log("✅ Token geladen");
}

// ===== EXPRESS SERVER =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Dashboard + Bot läuft sicher");
});

app.listen(PORT, () => {
  console.log("🌐 Webserver läuft auf Port " + PORT);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("🤖 Bot ist online als " + client.user.tag);
});

client.on("error", console.error);

// ===== LOGIN =====
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN);
}
