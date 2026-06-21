const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 8494308052;

// ================= BOT (FIXED) =================
// جلوگیری از 409 conflict + پایداری بیشتر روی Railway
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    autoStart: true,
    interval: 2000,
    params: {
      timeout: 10
    }
  }
});

// ================= MEMORY DB =================
const chats = new Map();

function getChat(id) {
  if (!chats.has(id)) {
    chats.set(id, []);
  }
  return chats.get(id);
}

// ================= INCOMING MESSAGES =================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // ignore admin messages
  if (chatId === ADMIN_ID) return;

  const chat = getChat(chatId);

  chat.push({
    from: "employee",
    text,
    date: Date.now()
  });

  try {
    await bot.sendMessage(
      ADMIN_ID,
      `📩 New Message\n👤 ID: ${chatId}\n💬 ${text}`
    );
  } catch (err) {
    console.error("ADMIN NOTIFY ERROR:", err.message);
  }
});

// ================= USERS LIST =================
app.get("/users", (req, res) => {

  const list = [...chats.keys()].map(id => ({
    employeeId: id,
    lastMessage: chats.get(id).slice(-1)[0] || null
  }));

  res.json(list);
});

// ================= CHAT HISTORY =================
app.get("/chat/:id", (req, res) => {

  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "invalid id" });
  }

  res.json(getChat(id));
});

// ================= ADMIN SEND MESSAGE =================
app.post("/send", async (req, res) => {

  const { employeeId, text } = req.body;

  if (!employeeId || !text) {
    return res.status(400).json({
      success: false,
      error: "missing data"
    });
  }

  const id = Number(employeeId);
  const chat = getChat(id);

  chat.push({
    from: "admin",
    text,
    date: Date.now()
  });

  try {
    await bot.sendMessage(
      id,
      `📩 پیام از ادمین:\n\n💬 ${text}`
    );
  } catch (err) {
    console.error("SEND ERROR:", err.message);
  }

  res.json({ success: true });
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Employee Bot Running ✅");
});

// ================= START (FIXED) =================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
