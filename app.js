require('dotenv').config();
const { App } = require('@slack/bolt');
const { askClaude } = require('./claude');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.message(async ({ event, client, logger }) => {
  // DM only
  if (event.channel_type !== 'im') return;
  // Ignore bot messages
  if (event.bot_id) return;
  // Ignore empty messages
  if (!event.text || !event.text.trim()) return;

  try {
    const reply = await askClaude(event.text.trim());
    await client.chat.postMessage({ channel: event.channel, text: reply });
  } catch (err) {
    logger.error(err);
    await client.chat.postMessage({
      channel: event.channel,
      text: 'Sorry, something went wrong. Please try again.',
    });
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`Slack bot running on port ${port}`);
})();
