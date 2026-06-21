const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(
  "8909778001:AAG_3mfdu5mwmGXOireaO-Cux8S4RXhsMkc",
  { polling: true }
);

const ADMIN_ID = 8494308052;

// پیام کارمند به ادمین
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // پیام‌های ادمین پردازش نشود
  if (chatId === ADMIN_ID) return;

  const text = msg.text || "";

  bot.sendMessage(
    ADMIN_ID,
    `📩 پیام از کارمند:\n\n${text}\n\nID: ${chatId}`
  );
});

// پاسخ ادمین
bot.on("message", (msg) => {
  if (msg.chat.id !== ADMIN_ID) return;
  if (!msg.reply_to_message) return;

  const match = msg.reply_to_message.text.match(/ID:\s(\d+)/);
  if (!match) return;

  const targetId = match[1];

  bot.sendMessage(targetId, msg.text);
});

console.log("Bot is running...");
