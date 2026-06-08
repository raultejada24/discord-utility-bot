import { randomInt } from 'node:crypto';
import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  version as discordJsVersion,
} from 'discord.js';

const EMBED_COLOR = 0x5865f2;
const DISCORD_EPOCH = 1420070400000n;

function createEmbed(title, description = null, color = EMBED_COLOR) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

function discordTimestamp(date, style = 'F') {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function disableMentions(content) {
  return {
    content,
    allowedMentions: { parse: [] },
  };
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

function channelTypeName(type) {
  return String(ChannelType[type] ?? 'Unknown').replaceAll('_', ' ');
}

function normalizeHexColor(value) {
  const cleaned = value.trim().replace(/^#/, '');
  const expanded = cleaned.length === 3
    ? cleaned
        .split('')
        .map((character) => character.repeat(2))
        .join('')
    : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null;
  }

  return {
    hex: `#${expanded.toUpperCase()}`,
    integer: Number.parseInt(expanded, 16),
  };
}

function convertTemperature(value, from, to) {
  let celsius;

  if (from === 'celsius') celsius = value;
  if (from === 'fahrenheit') celsius = (value - 32) * (5 / 9);
  if (from === 'kelvin') celsius = value - 273.15;

  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * (9 / 5) + 32;
  return celsius + 273.15;
}

function temperatureUnit(unit) {
  return {
    celsius: '°C',
    fahrenheit: '°F',
    kelvin: 'K',
  }[unit];
}

function isBelowAbsoluteZero(value, unit) {
  if (unit === 'celsius') return value < -273.15;
  if (unit === 'fahrenheit') return value < -459.67;
  return value < 0;
}

function createPassword(length, includeSymbols) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*+-=?';
  const characters = letters + numbers + (includeSymbols ? symbols : '');

  return Array.from(
    { length },
    () => characters[randomInt(0, characters.length)],
  ).join('');
}

const informationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check the bot and Discord gateway latency.'),
    category: 'Information',
    async execute(interaction) {
      const startedAt = Date.now();
      await interaction.reply('Checking latency...');
      const responseLatency = Date.now() - startedAt;
      const gatewayLatency = Math.max(0, Math.round(interaction.client.ws.ping));

      await interaction.editReply(
        `Pong! Response: **${responseLatency} ms** | Gateway: **${gatewayLatency} ms**`,
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('server')
      .setDescription('Show information about this Discord server.'),
    category: 'Information',
    async execute(interaction) {
      if (!interaction.guild) {
        await interaction.reply({
          content: 'This command can only be used inside a Discord server.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const owner = await interaction.guild.fetchOwner();
      const embed = createEmbed(interaction.guild.name)
        .setThumbnail(interaction.guild.iconURL({ size: 256 }))
        .addFields(
          { name: 'Members', value: String(interaction.guild.memberCount), inline: true },
          { name: 'Owner', value: owner.user.tag, inline: true },
          { name: 'Server ID', value: interaction.guild.id, inline: true },
          {
            name: 'Created',
            value: discordTimestamp(interaction.guild.createdAt),
            inline: false,
          },
        );

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('user')
      .setDescription('Show information about a Discord user.')
      .addUserOption((option) =>
        option
          .setName('member')
          .setDescription('The user to inspect.')
          .setRequired(false),
      ),
    category: 'Information',
    async execute(interaction) {
      const user = interaction.options.getUser('member') ?? interaction.user;
      const member = interaction.guild
        ? await interaction.guild.members.fetch(user.id).catch(() => null)
        : null;

      const embed = createEmbed(user.tag)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'User ID', value: user.id, inline: true },
          { name: 'Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
          {
            name: 'Account Created',
            value: discordTimestamp(user.createdAt),
            inline: false,
          },
        );

      if (member?.joinedAt) {
        embed.addFields({
          name: 'Joined This Server',
          value: discordTimestamp(member.joinedAt),
          inline: false,
        });
      }

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Show the full-size avatar of a Discord user.')
      .addUserOption((option) =>
        option
          .setName('member')
          .setDescription('The user whose avatar you want to view.')
          .setRequired(false),
      ),
    category: 'Information',
    async execute(interaction) {
      const user = interaction.options.getUser('member') ?? interaction.user;
      const avatarUrl = user.displayAvatarURL({ size: 1024 });
      const embed = createEmbed(`${user.username}'s Avatar`)
        .setImage(avatarUrl)
        .setURL(avatarUrl);

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('role')
      .setDescription('Show information about a server role.')
      .setDMPermission(false)
      .addRoleOption((option) =>
        option
          .setName('role')
          .setDescription('The role to inspect.')
          .setRequired(true),
      ),
    category: 'Information',
    async execute(interaction) {
      const role = interaction.options.getRole('role', true);
      const embed = createEmbed(role.name, null, role.color || EMBED_COLOR)
        .addFields(
          { name: 'Role ID', value: role.id, inline: true },
          { name: 'Color', value: role.hexColor, inline: true },
          { name: 'Position', value: String(role.position), inline: true },
          { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
          { name: 'Created', value: discordTimestamp(role.createdAt), inline: false },
        );

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('channel')
      .setDescription('Show information about a server channel.')
      .setDMPermission(false)
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('The channel to inspect.')
          .setRequired(false),
      ),
    category: 'Information',
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') ?? interaction.channel;

      if (!channel) {
        await interaction.reply({
          content: 'The channel could not be found.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const embed = createEmbed(channel.name ?? 'Direct Message Channel')
        .addFields(
          { name: 'Channel ID', value: channel.id, inline: true },
          { name: 'Type', value: channelTypeName(channel.type), inline: true },
          { name: 'Created', value: discordTimestamp(channel.createdAt), inline: false },
        );

      if ('topic' in channel && channel.topic) {
        embed.setDescription(channel.topic.slice(0, 4096));
      }

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('botinfo')
      .setDescription('Show runtime information about the bot.'),
    category: 'Information',
    async execute(interaction) {
      const client = interaction.client;
      const embed = createEmbed('Bot Information')
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
          { name: 'Commands', value: String(commands.length), inline: true },
          { name: 'Uptime', value: formatDuration(client.uptime ?? 0), inline: true },
          { name: 'Node.js', value: process.version, inline: true },
          { name: 'discord.js', value: discordJsVersion, inline: true },
        );

      await interaction.reply({ embeds: [embed] });
    },
  },
];

const funCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('roll')
      .setDescription('Roll a die with a custom number of sides.')
      .addIntegerOption((option) =>
        option
          .setName('sides')
          .setDescription('Number of sides on the die.')
          .setMinValue(2)
          .setMaxValue(1000)
          .setRequired(false),
      ),
    category: 'Fun',
    async execute(interaction) {
      const sides = interaction.options.getInteger('sides') ?? 6;
      const result = randomInt(1, sides + 1);

      await interaction.reply(
        `${interaction.user} rolled **${result}** on a **${sides}-sided** die.`,
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription('Flip a coin.'),
    category: 'Fun',
    async execute(interaction) {
      const result = randomInt(0, 2) === 0 ? 'Heads' : 'Tails';
      await interaction.reply(`The coin landed on **${result}**.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('choose')
      .setDescription('Choose one item from a comma-separated list.')
      .addStringOption((option) =>
        option
          .setName('options')
          .setDescription('Example: pizza, pasta, salad')
          .setMaxLength(1000)
          .setRequired(true),
      ),
    category: 'Fun',
    async execute(interaction) {
      const choices = interaction.options
        .getString('options', true)
        .split(',')
        .map((choice) => choice.trim())
        .filter(Boolean);

      if (choices.length < 2) {
        await interaction.reply({
          content: 'Provide at least two choices separated by commas.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const choice = choices[randomInt(0, choices.length)];
      await interaction.reply(disableMentions(`I choose: **${choice}**`));
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('random')
      .setDescription('Generate a random number inside a range.')
      .addIntegerOption((option) =>
        option
          .setName('minimum')
          .setDescription('The smallest possible number.')
          .setMinValue(-1000000)
          .setMaxValue(1000000)
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName('maximum')
          .setDescription('The largest possible number.')
          .setMinValue(-1000000)
          .setMaxValue(1000000)
          .setRequired(true),
      ),
    category: 'Fun',
    async execute(interaction) {
      const minimum = interaction.options.getInteger('minimum', true);
      const maximum = interaction.options.getInteger('maximum', true);

      if (minimum > maximum) {
        await interaction.reply({
          content: 'The minimum cannot be greater than the maximum.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const result = randomInt(minimum, maximum + 1);
      await interaction.reply(`Random result: **${result}**`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('eightball')
      .setDescription('Ask the magic eight ball a question.')
      .addStringOption((option) =>
        option
          .setName('question')
          .setDescription('A yes-or-no question.')
          .setMaxLength(500)
          .setRequired(true),
      ),
    category: 'Fun',
    async execute(interaction) {
      const answers = [
        'It is certain.',
        'Without a doubt.',
        'Yes, definitely.',
        'Most likely.',
        'Signs point to yes.',
        'Ask again later.',
        'Cannot predict now.',
        'Do not count on it.',
        'My reply is no.',
        'Very doubtful.',
      ];
      const question = interaction.options.getString('question', true);
      const answer = answers[randomInt(0, answers.length)];

      await interaction.reply(
        disableMentions(`**Question:** ${question}\n**Answer:** ${answer}`),
      );
    },
  },
];

const utilityCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('echo')
      .setDescription('Repeat a message without creating mentions.')
      .addStringOption((option) =>
        option
          .setName('message')
          .setDescription('The message to repeat.')
          .setMaxLength(1000)
          .setRequired(true),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const message = interaction.options.getString('message', true);
      await interaction.reply(disableMentions(message));
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('calculate')
      .setDescription('Calculate a basic arithmetic operation.')
      .addStringOption((option) =>
        option
          .setName('operation')
          .setDescription('The operation to perform.')
          .setRequired(true)
          .addChoices(
            { name: 'Add', value: 'add' },
            { name: 'Subtract', value: 'subtract' },
            { name: 'Multiply', value: 'multiply' },
            { name: 'Divide', value: 'divide' },
            { name: 'Modulo', value: 'modulo' },
          ),
      )
      .addNumberOption((option) =>
        option
          .setName('first')
          .setDescription('The first number.')
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName('second')
          .setDescription('The second number.')
          .setRequired(true),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const operation = interaction.options.getString('operation', true);
      const first = interaction.options.getNumber('first', true);
      const second = interaction.options.getNumber('second', true);

      if ((operation === 'divide' || operation === 'modulo') && second === 0) {
        await interaction.reply({
          content: 'Division by zero is not allowed.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const calculations = {
        add: first + second,
        subtract: first - second,
        multiply: first * second,
        divide: first / second,
        modulo: first % second,
      };
      const symbols = {
        add: '+',
        subtract: '-',
        multiply: '×',
        divide: '÷',
        modulo: '%',
      };

      await interaction.reply(
        `**${first} ${symbols[operation]} ${second} = ${calculations[operation]}**`,
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('temperature')
      .setDescription('Convert between Celsius, Fahrenheit and Kelvin.')
      .addNumberOption((option) =>
        option
          .setName('value')
          .setDescription('The temperature value.')
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('from')
          .setDescription('The original unit.')
          .setRequired(true)
          .addChoices(
            { name: 'Celsius', value: 'celsius' },
            { name: 'Fahrenheit', value: 'fahrenheit' },
            { name: 'Kelvin', value: 'kelvin' },
          ),
      )
      .addStringOption((option) =>
        option
          .setName('to')
          .setDescription('The target unit.')
          .setRequired(true)
          .addChoices(
            { name: 'Celsius', value: 'celsius' },
            { name: 'Fahrenheit', value: 'fahrenheit' },
            { name: 'Kelvin', value: 'kelvin' },
          ),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const value = interaction.options.getNumber('value', true);
      const from = interaction.options.getString('from', true);
      const to = interaction.options.getString('to', true);

      if (isBelowAbsoluteZero(value, from)) {
        await interaction.reply({
          content: 'The temperature cannot be below absolute zero.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const converted = convertTemperature(value, from, to);

      await interaction.reply(
        `**${value} ${temperatureUnit(from)} = ${converted.toFixed(2)} ${temperatureUnit(to)}**`,
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('color')
      .setDescription('Preview a hexadecimal color.')
      .addStringOption((option) =>
        option
          .setName('hex')
          .setDescription('A 3-digit or 6-digit HEX color.')
          .setMaxLength(7)
          .setRequired(true),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const color = normalizeHexColor(interaction.options.getString('hex', true));

      if (!color) {
        await interaction.reply({
          content: 'Enter a valid HEX color such as `#5865F2` or `#F90`.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const embed = createEmbed(color.hex, 'HEX color preview.', color.integer);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('password')
      .setDescription('Generate a random password privately.')
      .addIntegerOption((option) =>
        option
          .setName('length')
          .setDescription('Password length from 8 to 64 characters.')
          .setMinValue(8)
          .setMaxValue(64)
          .setRequired(false),
      )
      .addBooleanOption((option) =>
        option
          .setName('symbols')
          .setDescription('Include special characters.')
          .setRequired(false),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const length = interaction.options.getInteger('length') ?? 20;
      const includeSymbols = interaction.options.getBoolean('symbols') ?? true;
      const password = createPassword(length, includeSymbols);

      await interaction.reply({
        content: `Generated password:\n\`\`\`\n${password}\n\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('timestamp')
      .setDescription('Format a Unix timestamp for Discord.')
      .addIntegerOption((option) =>
        option
          .setName('unix')
          .setDescription('Unix time in seconds.')
          .setMinValue(0)
          .setMaxValue(2147483647)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('style')
          .setDescription('Discord timestamp style.')
          .setRequired(false)
          .addChoices(
            { name: 'Full date and time', value: 'F' },
            { name: 'Short date and time', value: 'f' },
            { name: 'Full date', value: 'D' },
            { name: 'Short date', value: 'd' },
            { name: 'Relative time', value: 'R' },
            { name: 'Long time', value: 'T' },
            { name: 'Short time', value: 't' },
          ),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const unix = interaction.options.getInteger('unix', true);
      const style = interaction.options.getString('style') ?? 'F';
      const formatted = `<t:${unix}:${style}>`;

      await interaction.reply({
        content: `Preview: ${formatted}\nCode: \`${formatted}\``,
        flags: MessageFlags.Ephemeral,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('snowflake')
      .setDescription('Decode the creation time of a Discord ID.')
      .addStringOption((option) =>
        option
          .setName('id')
          .setDescription('A Discord user, server, channel or message ID.')
          .setMinLength(17)
          .setMaxLength(20)
          .setRequired(true),
      ),
    category: 'Utilities',
    async execute(interaction) {
      const id = interaction.options.getString('id', true);

      if (!/^\d{17,20}$/.test(id)) {
        await interaction.reply({
          content: 'Enter a valid Discord ID containing only digits.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const milliseconds = (BigInt(id) >> 22n) + DISCORD_EPOCH;
      const date = new Date(Number(milliseconds));

      await interaction.reply({
        content: `Created: ${discordTimestamp(date)}\nRelative: ${discordTimestamp(date, 'R')}`,
        flags: MessageFlags.Ephemeral,
      });
    },
  },
];

const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Delete recent messages from the current channel.')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((option) =>
        option
          .setName('amount')
          .setDescription('Number of recent messages to delete.')
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true),
      ),
    category: 'Moderation',
    async execute(interaction) {
      const amount = interaction.options.getInteger('amount', true);
      const channel = interaction.channel;

      if (!channel || typeof channel.bulkDelete !== 'function') {
        await interaction.reply({
          content: 'Messages cannot be cleared in this channel.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const deletedMessages = await channel.bulkDelete(amount, true);
      await interaction.editReply(
        `Deleted **${deletedMessages.size}** recent message(s). Messages older than 14 days are skipped.`,
      );
    },
  },
];

const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List the available bot commands.'),
  category: 'Information',
  async execute(interaction) {
    const categories = new Map();

    for (const command of commands) {
      if (command.data.name === 'help') {
        continue;
      }

      const entries = categories.get(command.category) ?? [];
      entries.push(`\`/${command.data.name}\` - ${command.data.description}`);
      categories.set(command.category, entries);
    }

    const embed = createEmbed(
      'Utility Bot Commands',
      'Use Discord slash commands to run any utility.',
    ).setFooter({
      text: `${commands.length} commands available.`,
    });

    for (const [category, entries] of categories) {
      embed.addFields({
        name: category,
        value: entries.join('\n'),
      });
    }

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const commands = [
  helpCommand,
  ...informationCommands,
  ...funCommands,
  ...utilityCommands,
  ...moderationCommands,
];

export const commandData = commands.map((command) => command.data.toJSON());
