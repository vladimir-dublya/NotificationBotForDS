require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
})

const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const WATCHED_CHANNEL_IDS = process.env.CHANNEL_IDS.split(',')

async function sendTelegramMessage(message) {
  await fetch(TELEGRAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    }),
  })
}

client.on('ready', async () => {
  console.log(`Bot is ready as ${client.user.tag}`)

  for (const guild of client.guilds.cache.values()) {
    await guild.channels.fetch() // Ensure channels are cached
    const voiceChannels = guild.channels.cache.filter(
      (channel) => WATCHED_CHANNEL_IDS.includes(channel.id)
    )

    for (const channel of voiceChannels.values()) {
      const members = channel.members
      if (members.size > 0) {
        const usernames = [...members.values()].map((member) => member.user.username)
        const message = `При запуске бота обнаружено: ${usernames.join(', ')} находятся в голосовом канале: ${channel.name}`
        await sendTelegramMessage(message)
      }
    }
  }
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  const joinedChannel = newState.channelId
  const leftChannel = oldState.channelId
  const user = newState.member?.user

  if (
    joinedChannel &&
    joinedChannel !== leftChannel &&
    WATCHED_CHANNEL_IDS.includes(joinedChannel)
  ) {
    const channelName = newState.channel?.name || 'Unknown channel'
    const message = `${user.username} вошёл в голосовой канал: ${channelName}`
    await sendTelegramMessage(message)
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
