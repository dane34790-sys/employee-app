console.log("SERVER OK");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8494308052;

// ================= MEMORY DB =================
const chats = new Map();

function getChat(id) {
  if (!chats.has(id)) chats.set(id, []);
  return chats.get(id);
}

// ================= BOT (WEBHOOK MODE) =================
const bot = new TelegramBot(TOKEN);

// این مهمه 👇 webhook فعال میشه
const WEBHOOK_URL = `https://employee-app-production-46a9.up.railway.app/bot${TOKEN}`;

bot.setWebHook(WEBHOOK_URL);

// ================= RECEIVE UPDATE =================
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ================= MESSAGE HANDLER =================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || "";

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
  } catch (e) {
    console.error(e.message);
  }
});

// ================= API =================
app.get("/users", (req, res) => {
  const list = [...chats.keys()].map(id => ({
    employeeId: id,
    lastMessage: chats.get(id).slice(-1)[0]
  }));

  res.json(list);
});

app.get("/chat/:id", (req, res) => {
  const id = Number(req.params.id);
  res.json(getChat(id));
});

app.post("/send", async (req, res) => {

  const { employeeId, text } = req.body;

  const id = Number(employeeId);
  const chat = getChat(id);

  chat.push({
    from: "admin",
    text,
    date: Date.now()
  });

  try {
    await bot.sendMessage(id, `📩 پیام از ادمین:\n\n💬 ${text}`);
  } catch (e) {
    console.error(e.message);
  }

  res.json({ success: true });
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Webhook Bot Running ✅");
});

// ================= START =================
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
