import { REST, Routes } from 'discord.js';
import { commandData } from './commands.js';
import {
  loadEnvironment,
  optionalEnvironmentValue,
  requiredEnvironmentValue,
} from './environment.js';

loadEnvironment();

const token = requiredEnvironmentValue('DISCORD_TOKEN');
const clientId = requiredEnvironmentValue('DISCORD_CLIENT_ID');
const guildId = optionalEnvironmentValue('DISCORD_GUILD_ID');
const rest = new REST({ version: '10' }).setToken(token);

try {
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);
  const scope = guildId ? `server ${guildId}` : 'all servers';

  console.log(`Registering ${commandData.length} commands for ${scope}...`);
  await rest.put(route, { body: commandData });
  console.log('Commands registered successfully.');
} catch (error) {
  console.error('Command registration failed:', error);
  process.exitCode = 1;
}
