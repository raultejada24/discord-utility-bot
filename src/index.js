import {
  ActivityType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from 'discord.js';
import { commands } from './commands.js';
import { loadEnvironment, requiredEnvironmentValue } from './environment.js';

loadEnvironment();

const token = requiredEnvironmentValue('DISCORD_TOKEN');
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
const commandHandlers = new Collection(
  commands.map((command) => [command.data.name, command]),
);

client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setActivity(`/help | ${commands.length} commands`, {
    type: ActivityType.Listening,
  });

  console.log(`Logged in as ${readyClient.user.tag}.`);
  console.log(`Serving ${readyClient.guilds.cache.size} Discord server(s).`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandHandlers.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: 'This command is not available.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);

    const response = {
      content: 'The command could not be completed. Please try again.',
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down the bot.');
  client.destroy();
  process.exit(0);
});

await client.login(token);
