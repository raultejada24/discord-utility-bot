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
5. Copy `.env.example` to `.env` and add your values.

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

- `/help` lists available commands.
- `/ping` checks the bot latency.
- `/server` shows server information.
- `/user` shows Discord account information.
- `/roll` rolls a configurable die.
- `/echo` repeats a message without creating mentions.

Never commit your `.env` file or share your bot token.
