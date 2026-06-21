const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

// 👇 ذخیره کارمندها (موقت)
const users = new Map();

// BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});


// ===================================
// 1. پیام از تلگرام به ادمین (کارمندان)
// ===================================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // ❌ پیام ادمین نادیده گرفته شود
  if (chatId === ADMIN_ID) return;

  // 👇 ذخیره کارمند
  users.set(chatId, true);

  try {

    await bot.sendMessage(
      ADMIN_ID,
      `📩 Telegram Message

👤 Employee ID: ${chatId}

💬 ${text}`
    );

    await bot.sendMessage(
      chatId,
      "✅ پیام شما برای مدیریت ارسال شد."
    );

  } catch (err) {
    console.error("Telegram Error:", err);
  }

});


// ===================================
// 2. پیام از PWA به ادمین
// ===================================
app.post("/sendToAdmin", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!text || !employeeId) {
    return res.status(400).json({
      success: false,
      message: "Invalid data"
    });
  }

  try {

    await bot.sendMessage(
      ADMIN_ID,
      `📩 PWA Message

👤 Employee: ${employeeId}

💬 ${text}`
    );

    res.json({ success: true });

  } catch (err) {

    console.error("PWA Error:", err);

    res.status(500).json({ success: false });

  }

});


// ===================================
// 3. جواب ادمین به کارمند (خیلی مهم)
// ===================================
app.post("/replyToEmployee", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({
      success: false,
      message: "Missing data"
    });
  }

  try {

    await bot.sendMessage(
      employeeId,
      `📩 پیام از ادمین:

💬 ${text}`
    );

    res.json({ success: true });

  } catch (err) {

    console.error("Reply Error:", err);

    res.status(500).json({ success: false });

  }

});


// ===================================
// 4. تست سرور
// ===================================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});


// ===================================
// 5. Start Server
// ===================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});

console.log("Bot Running");
