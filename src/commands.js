import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

const EMBED_COLOR = 0x5865f2;

function createEmbed(title, description = null) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
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

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('List the available bot commands.'),
    async execute(interaction) {
      const commandList = commands
        .map((command) => `\`/${command.data.name}\` - ${command.data.description}`)
        .join('\n');

      const embed = createEmbed('Utility Bot Commands', commandList).setFooter({
        text: 'All commands use Discord slash commands.',
      });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check the bot and Discord gateway latency.'),
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
    async execute(interaction) {
      const sides = interaction.options.getInteger('sides') ?? 6;
      const result = Math.floor(Math.random() * sides) + 1;

      await interaction.reply(
        `${interaction.user} rolled **${result}** on a **${sides}-sided** die.`,
      );
    },
  },
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
    async execute(interaction) {
      const message = interaction.options.getString('message', true);

      await interaction.reply({
        content: message,
        allowedMentions: { parse: [] },
      });
    },
  },
];

export const commandData = commands.map((command) => command.data.toJSON());
