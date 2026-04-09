process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

console.log("START...");

// ===== IMPORTS =====
require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// ===== DEBUG TOKEN =====
console.log("TOKEN:", process.env.DISCORD_TOKEN);

// ===== EXPRESS =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("OK"));
app.listen(PORT, () => console.log("Web läuft"));

// ===== BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("Bot online");
});

client.login(process.env.DISCORD_TOKEN);
