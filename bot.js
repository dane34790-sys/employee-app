const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(
  process.env.BOT_TOKEN,
  { polling: true }
);

const ADMIN_ID = 1;

console.log("🤖 Bot is running...");

bot.on("message", async (msg) => {

  try {

    const chatId = msg.chat.id;
    const text = msg.text || "";

    console.log("MESSAGE:", chatId, text);

    // دستور استارت
    if (text === "/start") {

      await bot.sendMessage(
        chatId,
        "✅ ربات فعال است. پیام خود را ارسال کنید."
      );

      return;
    }

    // ===== پاسخ ادمین =====
    if (chatId === ADMIN_ID) {

      if (!msg.reply_to_message) return;

      const originalText = msg.reply_to_message.text || "";

      const match = originalText.match(/ID:\s(\d+)/);

      if (!match) return;

      const targetId = Number(match[1]);

      await bot.sendMessage(targetId, `📨 ${text}`);

      return;
    }

    // ===== پیام کارمند =====
    await bot.sendMessage(
      ADMIN_ID,
      `📩 پیام از کارمند

👤 ID: ${chatId}

💬 ${text}`
    );

    await bot.sendMessage(
      chatId,
      "✅ پیام شما برای ادمین ارسال شد."
    );

  } catch (err) {

    console.error("BOT ERROR:", err);

  }

});
