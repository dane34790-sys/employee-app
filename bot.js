const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const ADMIN_ID = 8494308052;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// 👇 مهم: دیتابیس موقت چت
const users = new Map();   // لیست کارمندها
const chats = new Map();   // پیام‌ها بر اساس هر کارمند

// ==========================
// 1. پیام از تلگرام (کارمند)
// ==========================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (chatId === ADMIN_ID) return;

  // ذخیره کارمند
  users.set(chatId, true);

  // ذخیره پیام در چت خودش
  if (!chats.has(chatId)) {
    chats.set(chatId, []);
  }

  chats.get(chatId).push({
    from: "employee",
    text,
    time: Date.now()
  });

  // ارسال به ادمین
  await bot.sendMessage(
    ADMIN_ID,
    `📩 New Message\n\n👤 ${chatId}\n\n💬 ${text}`
  );

  // تایید به کارمند
  await bot.sendMessage(chatId, "✅ پیام شما ارسال شد");
});


// ==========================
// 2. لیست کارمندان (برای پنل)
// ==========================
app.get("/users", (req, res) => {
  res.json([...users.keys()]);
});


// ==========================
// 3. گرفتن چت یک کارمند
// ==========================
app.get("/chat/:id", (req, res) => {
  const id = Number(req.params.id);
  res.json(chats.get(id) || []);
});


// ==========================
// 4. ارسال پیام ادمین به کارمند
// ==========================
app.post("/replyToEmployee", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({ success: false });
  }

  try {

    await bot.sendMessage(
      Number(employeeId),
      `📩 پیام از ادمین:\n\n💬 ${text}`
    );

    // ذخیره در چت
    if (!chats.has(Number(employeeId))) {
      chats.set(Number(employeeId), []);
    }

    chats.get(Number(employeeId)).push({
      from: "admin",
      text,
      time: Date.now()
    });

    res.json({ success: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});


// ==========================
app.get("/", (req, res) => {
  res.send("Bot Server Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running");
});
