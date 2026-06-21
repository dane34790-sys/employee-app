const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

bot.on("message", async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "✅ پیام شما دریافت شد:\n\n" + (msg.text || "")
  );
});

console.log("Bot is running...");
