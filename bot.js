const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8494308052;

// 🚨 جلوگیری از crash
if (!TOKEN) {
  console.log("❌ BOT_TOKEN is missing");
  process.exit(1);
}

// ================= MEMORY DB =================
const chats = new Map();

function getChat(id) {
  if (!chats.has(id)) chats.set(id, []);
  return chats.get(id);
}

// ================= BOT =================
const bot = new TelegramBot(TOKEN);

// ✅ webhook صحیح (بدون token داخل URL)
const WEBHOOK_URL = "https://employee-app-production-46a9.up.railway.app/bot";

bot.setWebHook(WEBHOOK_URL);

// ================= RECEIVE UPDATE =================
app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ================= MESSAGE =================
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
app.get("/", (req, res) => {
  res.send("Webhook Bot Running ✅");
});

// ================= START =================
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
