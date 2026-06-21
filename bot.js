const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

// BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});


// ================================
// 1. پیام از تلگرام به ادمین
// ================================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // فقط پیام‌های غیر ادمین
  if (chatId === ADMIN_ID) return;

  try {

    await bot.sendMessage(
      ADMIN_ID,
      `📩 Telegram Message\n\n${text}\n\nID: ${chatId}`
    );

    await bot.sendMessage(
      chatId,
      "✅ پیام شما برای مدیریت ارسال شد."
    );

  } catch (err) {
    console.error("Telegram Error:", err);
  }

});


// ================================
// 2. پیام از PWA به تلگرام (اصلی)
// ================================
app.post("/sendToAdmin", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: "Empty message" });
  }

  try {

    await bot.sendMessage(
      ADMIN_ID,
      `📩 PWA Message\n\n👤 Employee: ${employeeId}\n\n💬 ${text}`
    );

    res.json({ success: true });

  } catch (err) {

    console.error("PWA Error:", err);

    res.status(500).json({ success: false });

  }

});


// ================================
// 3. تست سرور
// ================================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});


// ================================
// 4. Start server
// ================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});

console.log("Bot Running");
