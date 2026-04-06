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

// ⏱ Plan Expiry
function getExpiry(plan) {
    const now = Date.now();
    if (plan === "week") return now + 7 * 24 * 60 * 60 * 1000;
    if (plan === "month") return now + 30 * 24 * 60 * 60 * 1000;
    if (plan === "lifetime") return null;
}

// 🔐 Check Key
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
    } catch (err) {
        console.log("Log Fehler:", err.message);
    }
}

// 📌 Commands
const commands = [
    new SlashCommandBuilder()
        .setName("createkey")
        .setDescription("Create key")
        .addStringOption(opt =>
            opt.setName("plan")
                .setRequired(true)
                .addChoices(
                    { name: "1 Week", value: "week" },
                    { name: "1 Month", value: "month" },
                    { name: "Lifetime", value: "lifetime" }
                )
        ),

    new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem key")
        .addStringOption(opt =>
            opt.setName("key").setRequired(true)
        ),

    new SlashCommandBuilder().setName("keylist").setDescription("List keys"),

    new SlashCommandBuilder()
        .setName("keydelete")
        .setDescription("Delete key")
        .addStringOption(opt => opt.setName("key").setRequired(true)),

    new SlashCommandBuilder()
        .setName("keyinfo")
        .setDescription("Key info")
        .addStringOption(opt => opt.setName("key").setRequired(true)),

    new SlashCommandBuilder()
        .setName("addstock")
        .setDescription("Add stock")
        .addStringOption(opt =>
            opt.setName("type")
                .setRequired(true)
                .addChoices(
                    { name: "cookies", value: "cookies" },
                    { name: "tokens", value: "tokens" }
                )
        )
        .addAttachmentOption(opt =>
            opt.setName("file")
                .setDescription("TXT Datei")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("gen")
        .setDescription("Generate stock")
        .addStringOption(opt =>
            opt.setName("type")
                .setRequired(true)
                .addChoices(
                    { name: "cookies", value: "cookies" },
                    { name: "tokens", value: "tokens" }
                )
        )
];

// 🚀 Register Commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

// 🔥 Ready
client.on("ready", async () => {
    await connectDB();
    console.log("🤖 Bot online");
});

// 🎯 Interactions
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const db = await connectDB();

    // ⏱ Cooldown (1 Minute)
    if (["gen"].includes(interaction.commandName)) {
        const last = cooldowns.get(interaction.user.id);
        if (last && Date.now() - last < 60000) {
            return interaction.reply({ content: "⏱ Warte 1 Minute!", ephemeral: true });
        }
        cooldowns.set(interaction.user.id, Date.now());
    }

    // 🔑 CREATE KEY
    if (interaction.commandName === "createkey") {
        const plan = interaction.options.getString("plan");
        const key = generateKey();
        const expires = getExpiry(plan);

        await db.collection("keys").insertOne({
            key,
            plan,
            expires,
            used: false,
            user: null
        });

        await sendLog(`🔑 Key erstellt: ${key} | Plan: ${plan} | Von: ${interaction.user.id}`);

        return interaction.reply(`🔑 Key: ${key}`);
    }

    // ✅ REDEEM
    if (interaction.commandName === "redeem") {
        const keyInput = interaction.options.getString("key");
        const key = await db.collection("keys").findOne({ key: keyInput });

        if (!key) return interaction.reply("❌ Invalid key");
        if (key.used) return interaction.reply("❌ Already used");

        await db.collection("keys").updateOne(
            { key: keyInput },
            { $set: { used: true, user: interaction.user.id } }
        );

        await sendLog(`✅ Key benutzt: ${keyInput} | User: ${interaction.user.id}`);

        return interaction.reply("✅ Key redeemed");
    }

    // 📋 KEY LIST
    if (interaction.commandName === "keylist") {
        const keys = await db.collection("keys").find().toArray();

        let text = keys.map(k =>
            `${k.key} | ${k.plan} | User: ${k.user || "None"}`
        ).join("\n");

        return interaction.reply("```" + text + "```");
    }

    // 🗑 DELETE
    if (interaction.commandName === "keydelete") {
        const key = interaction.options.getString("key");

        await db.collection("keys").deleteOne({ key });

        await sendLog(`🗑 Key gelöscht: ${key} | Von: ${interaction.user.id}`);

        return interaction.reply("🗑 Key deleted");
    }

    // ℹ️ INFO
    if (interaction.commandName === "keyinfo") {
        const keyInput = interaction.options.getString("key");
        const key = await db.collection("keys").findOne({ key: keyInput });

        if (!key) return interaction.reply("❌ Not found");

        return interaction.reply(
            `Plan: ${key.plan}\nUser: ${key.user}\nExpires: ${key.expires || "Lifetime"}`
        );
    }

    // 📦 ADD STOCK
    if (interaction.commandName === "addstock") {
        const type = interaction.options.getString("type");
        const attachment = interaction.options.getAttachment("file");

        if (!attachment) {
            return interaction.reply({ content: "❌ Bitte TXT Datei hochladen", ephemeral: true });
        }

        const res = await fetch(attachment.url);
        const text = await res.text();

        const lines = text.split("\n").filter(l => l.trim() !== "");

        const docs = lines.map(line => ({
            type,
            data: line,
            used: false,
            date: new Date()
        }));

        await db.collection("stock").insertMany(docs);

        await sendLog(`📦 ${lines.length} ${type} hinzugefügt | User: ${interaction.user.id}`);

        return interaction.reply(`✅ ${lines.length} ${type} hinzugefügt`);
    }

    // 🔐 GEN
    if (interaction.commandName === "gen") {
        const type = interaction.options.getString("type");

        const valid = await hasValidKey(db, interaction.user.id);
        if (!valid) {
            return interaction.reply({ content: "❌ Du brauchst einen Key!", ephemeral: true });
        }

        const item = await db.collection("stock").findOneAndUpdate(
            { type, used: false },
            { $set: { used: true, usedBy: interaction.user.id } }
        );

        if (!item.value) {
            return interaction.reply("❌ Kein Stock verfügbar");
        }

        const buffer = Buffer.from(item.value.data, "utf-8");

        await interaction.user.send({
            files: [{
                attachment: buffer,
                name: `${type}.txt`
            }]
        });

        await sendLog(`📥 ${type} generiert | User: ${interaction.user.id}`);

        return interaction.reply({ content: "✅ Check deine DMs!", ephemeral: true });
    }
});

client.login(TOKEN);
