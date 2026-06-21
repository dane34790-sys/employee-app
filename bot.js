const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// 👇 لیست کارمندان
const users = new Map();

// 👇 وضعیت انتخاب ادمین
let adminSelectedUser = null;


// =====================
// 1. پیام از کارمند به ادمین
// =====================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  // ذخیره کارمند
  users.set(chatId, {
    lastSeen: Date.now()
  });

  await bot.sendMessage(
    ADMIN_ID,
    `📩 New Message

👤 Employee ID: ${chatId}

💬 ${text}

➡️ برای جواب دادن:
POST /selectUser
{ "employeeId": ${chatId} }`
  );

});


// =====================
// 2. انتخاب کارمند برای ادمین
// =====================
app.post("/selectUser", (req, res) => {

  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false });
  }

  adminSelectedUser = Number(employeeId);

  res.json({
    success: true,
    selected: adminSelectedUser
  });

});


// =====================
// 3. جواب ادمین به کارمند
// =====================
app.post("/replyToEmployee", async (req, res) => {

  const { employeeId, text } = req.body;

  // اگر از API نفرستادی، از انتخاب ادمین استفاده کن
  const targetId = employeeId
    ? Number(employeeId)
    : adminSelectedUser;

  if (!targetId || !text) {
    return res.status(400).json({
      success: false,
      message: "No user selected"
    });
  }

  try {

    await bot.sendMessage(
      targetId,
      `📩 پیام از ادمین:

💬 ${text}`
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }

});


// =====================
// تست
// =====================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running");
});
