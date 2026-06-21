const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// 👇 لیست کارمندها
const users = new Map();

// 👇 چت فعال ادمین (مهم‌ترین بخش)
let activeChatUser = null;


// ==========================
// 1. پیام کارمند → ادمین
// ==========================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  // ذخیره کارمند
  users.set(chatId, {
    id: chatId,
    lastSeen: Date.now()
  });

  await bot.sendMessage(
    ADMIN_ID,
    `📩 New Message

👤 Employee ID: ${chatId}

💬 ${text}

➡️ برای پاسخ:
POST /selectUser
{ "employeeId": ${chatId} }`
  );
});


// ==========================
// 2. انتخاب کارمند در پنل ادمین
// ==========================
app.post("/selectUser", (req, res) => {

  const { employeeId } = req.body;

  activeChatUser = Number(employeeId);

  res.json({
    success: true,
    activeChatUser
  });

  console.log("Active chat set to:", activeChatUser);
});


// ==========================
// 3. ارسال پیام از PWA به ادمین
// ==========================
app.post("/sendToAdmin", async (req, res) => {

  const { employeeId, text } = req.body;

  await bot.sendMessage(
    ADMIN_ID,
    `📩 PWA Message

👤 Employee: ${employeeId}

💬 ${text}`
  );

  res.json({ success: true });
});


// ==========================
// 4. جواب ادمین به کارمند (اصلی)
// ==========================
app.post("/replyToEmployee", async (req, res) => {

  const { text } = req.body;

  if (!activeChatUser) {
    return res.status(400).json({
      success: false,
      message: "No user selected"
    });
  }

  try {

    await bot.sendMessage(
      activeChatUser,
      `📩 پیام از ادمین:

💬 ${text}`
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// ==========================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
