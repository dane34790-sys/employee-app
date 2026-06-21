const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

app.use(express.json({ limit: "20mb" }));

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

const ADMIN_ID = 8494308052;

// پیام از PWA به تلگرام
app.post("/sendToAdmin", async (req, res) => {

  try {

    const { employeeId, text } = req.body;

    await bot.sendMessage(
      ADMIN_ID,
      `📩 PWA Message\n\nEmployee: ${employeeId}\n\n${text}`
    );

    res.json({ success: true });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running");
});

console.log("Bot Running");
