process.on("uncaughtException", err => console.error("❌ Error:", err));
process.on("unhandledRejection", err => console.error("❌ Promise:", err));

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { connectDB, getDB } = require("./database");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// READY
client.once("ready", async () => {
    await connectDB();
    console.log("🤖 Bot online");
});

// COMMAND
const commands = [
    new SlashCommandBuilder()
        .setName("gen")
        .setDescription("Generiere Token oder Cookie")
        .addStringOption(option =>
            option.setName("type")
                .setDescription("token oder cookie")
                .setRequired(true)
                .addChoices(
                    { name: "Token", value: "token" },
                    { name: "Cookie", value: "cookie" }
                ))
].map(cmd => cmd.toJSON());

// REGISTER
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log("✅ Commands registriert");
    } catch (err) {
        console.error("❌ Command Fehler:", err);
    }
})();

// INTERACTION
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const db = getDB();
    if (!db) return interaction.reply({ content: "DB Fehler", ephemeral: true });

    if (interaction.commandName === "gen") {
        const type = interaction.options.getString("type");

        const item = await db.collection("stock").findOne({ type });

        if (!item) {
            return interaction.reply({ content: "❌ Kein Stock", ephemeral: true });
        }

        await db.collection("stock").deleteOne({ _id: item._id });

        try {
            await interaction.user.send(`📦 ${type}:\n${item.value}`);
            await interaction.reply({ content: "📩 Check DM", ephemeral: true });
        } catch {
            await interaction.reply({ content: "❌ DM nicht möglich", ephemeral: true });
        }
    }
});

// LOGIN
client.login(process.env.TOKEN);
