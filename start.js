// 🔥 START FILE: Discord Bot + Express Server (Render-ready)

// Debugging (zeigt Fehler im Render Log)
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// ===== IMPORTS =====
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

// ===== EXPRESS SERVER =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 Dashboard + Bot läuft!");
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

// Login mit ENV Token
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN fehlt!");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
