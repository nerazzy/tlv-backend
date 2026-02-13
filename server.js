import "dotenv/config"
import express from "express"
import cors from "cors"

const app = express()

app.use(express.json({ limit: "50kb" }))

// Разрешаем запросы только с твоего сайта (Vercel)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
  })
)

// Простая защита: секретный ключ в заголовке Authorization
function requireSecret(req, res, next) {
  const auth = req.headers.authorization || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || token !== process.env.LEAD_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" })
  }
  next()
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function getChatIds() {
  return (process.env.CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

async function sendTelegramToAll(text) {
  const ids = getChatIds()
  if (!ids.length) throw new Error("CHAT_IDS is empty")

  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`

  await Promise.all(
    ids.map(async (chat_id) => {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(`TG failed for ${chat_id}: ${JSON.stringify(j)}`)
    })
  )
}

// Проверка что сервер жив
app.get("/health", (req, res) => res.json({ ok: true }))

// Помощник: посмотреть апдейты Telegram и вытащить chat.id админов
app.get("/debug/telegram", async (req, res) => {
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getUpdates`)
    const j = await r.json()
    res.json(j)
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

// Приём заявки с сайта
app.post("/api/lead", requireSecret, async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80)
  const phone = String(req.body?.phone || "").replace(/[^\d+]/g, "").slice(0, 24)
  const service = String(req.body?.service || "").trim().slice(0, 80)
  const note = String(req.body?.note || "").trim().slice(0, 300)

  if (!name || phone.length < 6) {
    return res.status(400).json({ ok: false, error: "bad_request" })
  }

  const msg = [
    "🚗 <b>TLV Detailing — новая заявка</b>",
    "",
    `👤 <b>Имя:</b> ${esc(name)}`,
    `📞 <b>Телефон:</b> ${esc(phone)}`,
    `🛠 <b>Услуга:</b> ${esc(service || "Не выбрано")}`,
    note ? `📝 <b>Комментарий:</b> ${esc(note)}` : "",
    "",
    `⏱ <b>Время:</b> ${esc(new Date().toLocaleString("ru-RU"))}`,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    await sendTelegramToAll(msg)
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "telegram_failed" })
  }
})

app.listen(process.env.PORT || 3001, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT || 3001}`)
  console.log("ALLOWED_ORIGIN:", process.env.ALLOWED_ORIGIN)
  console.log("CHAT_IDS:", getChatIds())
})
