const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// 👇 دیتابیس ساده چت‌ها
const chats = new Map();

// =====================
// پیام از کارمند
// =====================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  // ذخیره پیام‌ها مثل واتساپ
  if (!chats.has(chatId)) {
    chats.set(chatId, []);
  }

  chats.get(chatId).push({
    from: "employee",
    text,
    date: Date.now()
  });

  // به ادمین اطلاع بده
  await bot.sendMessage(
    ADMIN_ID,
    `📩 New Message
👤 ID: ${chatId}
💬 ${text}`
  );
});


// =====================
// گرفتن لیست کارمندها (مثل لیست چت واتساپ)
// =====================
app.get("/users", (req, res) => {

  const list = [...chats.keys()].map(id => ({
    employeeId: id,
    lastMessage: chats.get(id).slice(-1)[0]
  }));

  res.json(list);
});


// =====================
// گرفتن چت یک کارمند
// =====================
app.get("/chat/:id", (req, res) => {

  const id = req.params.id;

  res.json(chats.get(Number(id)) || []);
});


// =====================
// ارسال پیام از ادمین
// =====================
app.post("/send", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({ success: false });
  }

  if (!chats.has(Number(employeeId))) {
    chats.set(Number(employeeId), []);
  }

  chats.get(Number(employeeId)).push({
    from: "admin",
    text,
    date: Date.now()
  });

  await bot.sendMessage(
    Number(employeeId),
    `📩 پیام از ادمین:\n\n💬 ${text}`
  );

  res.json({ success: true });
});


// =====================
app.get("/", (req, res) => {
  res.send("WhatsApp Admin Bot Running");
});

app.listen(process.env.PORT || 3000);
