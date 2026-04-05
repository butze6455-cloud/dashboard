const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const { connectDB, getDB } = require("./database");

const TOKEN = "MTQ5MDM5MzQ5MzY0MDgzOTMzOA.GAvKpQ.3-YECoynqtuSx2CcC9sjI5yy1dHLl0crpL_ZPI";


const CLIENT_ID = "1490393493640839338";
const GUILD_ID = "1490124748485820629";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
    await connectDB();
    console.log("🤖 Bot online");
});

// COMMANDS REGISTRIEREN
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

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

// INTERACTION
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const db = getDB();

    if (interaction.commandName === "gen") {
        const type = interaction.options.getString("type");

        const item = await db.collection("stock").findOne({ type });

        if (!item) {
            return interaction.reply({ content: "❌ Kein Stock", ephemeral: true });
        }

        await db.collection("stock").deleteOne({ _id: item._id });

        await interaction.user.send(`📦 ${type}:\n${item.value}`);
        await interaction.reply({ content: "📩 Check DM", ephemeral: true });
    }
});

client.login(TOKEN);