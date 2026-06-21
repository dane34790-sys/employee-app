const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const ADMIN_ID = 8494308052;

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  console.log("MESSAGE:", chatId, text);

  // پیام ادمین
  if (chatId === ADMIN_ID) {
    return;
  }

  // پیام کارمند → ادمین
  await bot.sendMessage(
    ADMIN_ID,
    `📩 پیام جدید\n\n${text}\n\nID:${chatId}`
  );

  // تایید به کارمند
  await bot.sendMessage(
    chatId,
    "✅ پیام شما برای مدیریت ارسال شد."
  );
});

console.log("🤖 Bot is running...");
