require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const TelegramBot = require('node-telegram-bot-api')

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const WATCHED_CHANNEL_IDS = process.env.CHANNEL_IDS.split(',')

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
})

const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

async function checkVoiceChannelUsers() {
  let messages = []

  for (const guild of discordClient.guilds.cache.values()) {
    await guild.channels.fetch()
    const voiceChannels = guild.channels.cache.filter(
      (channel) => WATCHED_CHANNEL_IDS.includes(channel.id)
    )

    for (const channel of voiceChannels.values()) {
      const members = channel.members
      if (members.size > 0) {
        const usernames = [...members.values()].map((m) => m.user.globalName)
        messages.push(
          `В голосовом канале "${channel.name}" находятся: ${usernames.join(', ')}`
        )
      }
    }
  }

  return messages.length > 0 ? messages.join('\n') : 'В избранных каналах никого нет.'
}

telegramBot.onText(/\/check/, async (msg) => {
  if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return

  const message = await checkVoiceChannelUsers()
  telegramBot.sendMessage(msg.chat.id, message)
})

discordClient.once('ready', () => {
  console.log(`Discord bot is ready as ${discordClient.user.tag}`)
})

discordClient.login(DISCORD_BOT_TOKEN)
