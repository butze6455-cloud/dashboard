const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const { connectDB } = require("./database");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

let cooldowns = new Map();

// 🔑 Key Generator
function generateKey() {
    return "VaultAlts" + Math.floor(100000 + Math.random() * 900000);
}

// ⏱ Expiry
function getExpiry(plan) {
    const now = Date.now();
    if (plan === "week") return now + 7 * 24 * 60 * 60 * 1000;
    if (plan === "month") return now + 30 * 24 * 60 * 60 * 1000;
    if (plan === "lifetime") return null;
}

// 🔐 Key Check
async function hasValidKey(db, userId) {
    const key = await db.collection("keys").findOne({ user: userId });
    if (!key) return false;
    if (key.expires && Date.now() > key.expires) return false;
    return true;
}

// 📜 Logs
async function sendLog(message) {
    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!channel) return;
        const time = new Date().toLocaleString("de-DE");
        channel.send(`📜 [${time}]\n${message}`);
    } catch {}
}

// 📌 Commands
const commands = [
    new SlashCommandBuilder().setName("createkey").setDescription("Create key")
        .addStringOption(opt => opt.setName("plan").setDescription("Plan").setRequired(true)
            .addChoices(
                { name: "1 Week", value: "week" },
                { name: "1 Month", value: "month" },
                { name: "Lifetime", value: "lifetime" }
            )
        ),

    new SlashCommandBuilder().setName("redeem").setDescription("Redeem key")
        .addStringOption(opt => opt.setName("key").setDescription("Key").setRequired(true)),

    new SlashCommandBuilder().setName("keylist").setDescription("List keys"),

    new SlashCommandBuilder().setName("keydelete").setDescription("Delete key")
        .addStringOption(opt => opt.setName("key").setDescription("Key").setRequired(true)),

    new SlashCommandBuilder().setName("keyinfo").setDescription("Key info")
        .addStringOption(opt => opt.setName("key").setDescription("Key").setRequired(true)),

    new SlashCommandBuilder().setName("addstock").setDescription("Add stock")
        .addStringOption(opt => opt.setName("type").setDescription("Type").setRequired(true)
            .addChoices(
                { name: "cookies", value: "cookies" },
                { name: "tokens", value: "tokens" }
            )
        )
        .addAttachmentOption(opt => opt.setName("file").setDescription("TXT Datei").setRequired(true)),

    new SlashCommandBuilder().setName("gen").setDescription("Generate stock")
        .addStringOption(opt => opt.setName("type").setDescription("Type").setRequired(true)
            .addChoices(
                { name: "cookies", value: "cookies" },
                { name: "tokens", value: "tokens" }
            )
        )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

client.on("ready", async () => {
    await connectDB();
    console.log("🤖 Bot online");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const db = await connectDB();

    // ⏱ Cooldown
    if (interaction.commandName === "gen") {
        const last = cooldowns.get(interaction.user.id);
        if (last && Date.now() - last < 60000) {
            return interaction.reply({ content: "⏱ Warte 1 Minute!", ephemeral: true });
        }
        cooldowns.set(interaction.user.id, Date.now());
    }

    // 🔑 CREATE
    if (interaction.commandName === "createkey") {
        const plan = interaction.options.getString("plan");
        const key = generateKey();
        const expires = getExpiry(plan);

        await db.collection("keys").insertOne({
            key, plan, expires, used: false, user: null
        });

        await sendLog(`🔑 Key erstellt: ${key} | ${plan}`);

        return interaction.reply(`🔑 ${key}`);
    }

    // ✅ REDEEM
    if (interaction.commandName === "redeem") {
        const keyInput = interaction.options.getString("key");
        const key = await db.collection("keys").findOne({ key: keyInput });

        if (!key) return interaction.reply("❌ Invalid");
        if (key.used) return interaction.reply("❌ Used");

        await db.collection("keys").updateOne(
            { key: keyInput },
            { $set: { used: true, user: interaction.user.id } }
        );

        await sendLog(`✅ Redeemed: ${keyInput}`);

        return interaction.reply("✅ Done");
    }

    // 📋 LIST
    if (interaction.commandName === "keylist") {
        const keys = await db.collection("keys").find().toArray();

        return interaction.reply("```" +
            keys.map(k => `${k.key} | ${k.plan} | ${k.user || "None"}`).join("\n")
            + "```");
    }

    // 🗑 DELETE
    if (interaction.commandName === "keydelete") {
        const key = interaction.options.getString("key");
        await db.collection("keys").deleteOne({ key });

        await sendLog(`🗑 Deleted: ${key}`);

        return interaction.reply("Deleted");
    }

    // ℹ️ INFO
    if (interaction.commandName === "keyinfo") {
        const keyInput = interaction.options.getString("key");
        const key = await db.collection("keys").findOne({ key: keyInput });

        if (!key) return interaction.reply("❌ Not found");

        return interaction.reply(`Plan: ${key.plan}\nUser: ${key.user}`);
    }

    // 📦 ADD STOCK
    if (interaction.commandName === "addstock") {
        const type = interaction.options.getString("type");
        const file = interaction.options.getAttachment("file");

        const res = await fetch(file.url);
        const text = await res.text();

        const lines = text.split("\n").filter(x => x);

        await db.collection("stock").insertMany(
            lines.map(l => ({ type, data: l, used: false }))
        );

        await sendLog(`📦 ${lines.length} ${type}`);

        return interaction.reply(`✅ ${lines.length} added`);
    }

    // 🔐 GEN
    if (interaction.commandName === "gen") {
        const type = interaction.options.getString("type");

        const valid = await hasValidKey(db, interaction.user.id);
        if (!valid) return interaction.reply("❌ Kein Key");

        const item = await db.collection("stock").findOneAndUpdate(
            { type, used: false },
            { $set: { used: true } }
        );

        if (!item.value) return interaction.reply("❌ Empty");

        const buffer = Buffer.from(item.value.data);

        await interaction.user.send({
            files: [{ attachment: buffer, name: `${type}.txt` }]
        });

        await sendLog(`📥 Gen ${type}`);

        return interaction.reply({ content: "✅ DM!", ephemeral: true });
    }
});

client.login(TOKEN);
