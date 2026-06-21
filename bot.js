const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot("TOKEN", { polling: true });

const ADMIN_ID = 123456789;

// نگه‌داشتن مپ پیام‌ها
const userMap = {};

// پیام کارمند به ادمین
bot.on("message", (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text;

  // پیام ادمین رو هندل نکن
  if (chatId === ADMIN_ID) return;

  // ذخیره ارتباط
  userMap[msg.message_id] = chatId;

  bot.sendMessage(ADMIN_ID,
    `📩 پیام از کارمند:\n\n${text}\n\nID: ${chatId}`
  );
});

// جواب ادمین
bot.on("message", (msg) => {

  if (msg.chat.id !== ADMIN_ID) return;
  if (!msg.reply_to_message) return;

  const originalText = msg.reply_to_message.text;

  const match = originalText.match(/ID:\s(\d+)/);
  if (!match) return;

  const targetId = match[1];

  bot.sendMessage(targetId, msg.text);
});
