const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// پیام‌های دریافتی از تلگرام
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  try {

    await bot.sendMessage(
      ADMIN_ID,
      `📩 Telegram Message\n\n${text}\n\nID:${chatId}`
    );

    await bot.sendMessage(
      chatId,
      "✅ پیام شما برای مدیریت ارسال شد."
    );

  } catch (err) {

    console.error(err);

  }

});

// پیام از PWA به تلگرام
app.post("/sendToAdmin", async (req, res) => {

  try {

    const { employeeId, text } = req.body;

    await bot.sendMessage(
      ADMIN_ID,
      `📩 PWA Message\n\nEmployee: ${employeeId}\n\n${text}`
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});

// برای تست دامنه
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});

console.log("Bot Running");
