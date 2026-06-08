# Discord Utility Bot

A simple Discord bot with English slash commands for server information and everyday utilities.

## Requirements

- Node.js 18 or newer.
- A Discord application with a bot token.

## Setup

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Open the **Bot** page, create the bot and copy its token.
3. Invite it with the `bot` and `applications.commands` scopes.
4. Give it **View Channels**, **Send Messages** and **Embed Links** permissions.
5. Add **Manage Messages** only if you want to use `/clear`.
6. Copy `.env.example` to `.env` and add your values.

```env
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=your-test-server-id
```

The Client ID is the **Application ID** on the General Information page. To copy a Server ID, enable Developer Mode in Discord, right-click the server and select **Copy Server ID**.

Install dependencies and register the commands:

```bash
npm install
npm run deploy
```

Start the bot:

```bash
npm start
```

`DISCORD_GUILD_ID` registers commands instantly in one server. Remove it to register commands globally, which can take longer to appear.

## Commands

### Information

- `/help` lists every available command.
- `/ping` checks response and gateway latency.
- `/server` shows server details.
- `/user` shows account and membership details.
- `/avatar` displays a full-size user avatar.
- `/role` shows role information.
- `/channel` shows channel information.
- `/botinfo` shows bot runtime and version details.

### Fun

- `/roll` rolls a configurable die.
- `/coinflip` flips a coin.
- `/choose` selects from a comma-separated list.
- `/random` generates a number inside a range.
- `/eightball` answers a yes-or-no question.

### Utilities

- `/echo` repeats text without creating mentions.
- `/calculate` performs basic arithmetic.
- `/temperature` converts Celsius, Fahrenheit and Kelvin.
- `/color` previews a HEX color.
- `/password` privately generates a random password.
- `/timestamp` creates Discord timestamp markup.
- `/snowflake` decodes the creation time of a Discord ID.

### Moderation

- `/clear` deletes up to 100 recent messages and requires **Manage Messages**.

Never commit your `.env` file or share your bot token.
