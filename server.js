import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* --- CORS (ВАЖНО ДЛЯ VERCEL) --- */
app.use(
  cors({
    origin: [
      "https://tlv-detailing.vercel.app",
      "http://localhost:5173"
    ],
  })
);

/* --- ПРОВЕРКА ENV --- */
console.log("BOT TOKEN:", process.env.BOT_TOKEN ? "OK" : "MISSING");
console.log("ADMIN IDS:", process.env.ADMIN_IDS);
console.log("SECRET:", process.env.SECRET);

/* --- TELEGRAM --- */
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS?.split(",");

async function sendTelegram(text) {
  if (!BOT_TOKEN || !ADMIN_IDS) {
    console.log("Telegram disabled: no env");
    return;
  }

  for (const id of ADMIN_IDS) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: id.trim(),
          text,
        }),
      });
    } catch (e) {
      console.log("TG error:", e.message);
    }
  }
}

/* --- ROUTE --- */
app.post("/api/lead", async (req, res) => {
  try {
    const secret = req.headers.authorization?.replace("Bearer ", "");
    if (secret !== process.env.SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const { name, phone, choice, note } = req.body;

    console.log("=== NEW LEAD ===");
    console.log("Name:", name);
    console.log("Phone:", phone);
    console.log("Package:", choice);
    console.log("Note:", note);

    const message = `
🚗 Новая заявка TLV Detailing

👤 Имя: ${name}
📞 Телефон: ${phone}
📦 Пакет: ${choice}
📝 Комментарий: ${note || "-"}
`;

    await sendTelegram(message);

    res.json({ ok: true });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).json({ ok: false });
  }
});

/* --- START --- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
