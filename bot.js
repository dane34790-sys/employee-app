const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ذخیره کاربران
const users = new Map();

// =====================
// پیام از تلگرام (کارمند)
// =====================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  users.set(chatId, true);

  // ارسال فقط به ادمین
  await bot.sendMessage(
    ADMIN_ID,
    `📩 New Message

👤 Employee ID: ${chatId}

💬 ${text}`
  );

  // تایید به کارمند
  await bot.sendMessage(chatId, "✅ پیام شما ارسال شد به مدیریت");
});


// =====================
// پیام از PWA به ادمین
// =====================
app.post("/sendToAdmin", async (req, res) => {
  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({ success: false });
  }

  try {
    await bot.sendMessage(
      ADMIN_ID,
      `📩 PWA Message

👤 ${employeeId}

💬 ${text}`
    );

    res.json({ success: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});


// =====================
// پاسخ ادمین به کارمند (مهم)
// =====================
app.post("/replyToEmployee", async (req, res) => {
  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({ success: false });
  }

  try {
    await bot.sendMessage(
      Number(employeeId),
      `📩 پیام از ادمین:

💬 ${text}`
    );

    res.json({ success: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});


// =====================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
