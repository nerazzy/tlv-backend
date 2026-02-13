import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* ---------- ВОТ ЭТО ГЛАВНОЕ (CORS РАЗРЕШЕНИЕ) ---------- */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
/* -------------------------------------------------------- */

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS.split(",");
const SECRET = process.env.SECRET;

app.get("/", (req, res) => {
  res.send("TLV Backend OK");
});

app.post("/api/lead", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${SECRET}`) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const { name, phone, choice, note } = req.body;

    const text = `
🔥 НОВАЯ ЗАЯВКА TLV

👤 Имя: ${name}
📞 Телефон: ${phone}
📦 Пакет: ${choice}
📝 Комментарий: ${note || "—"}
`;

    for (const id of ADMIN_IDS) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text,
        }),
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server started on", PORT));
