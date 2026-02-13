import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;
const SECRET = process.env.SECRET || "TLV_SECRET_KEY_2026";

// --- CORS ---
app.use(cors({
  origin: [
    "https://tlv-detailing.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// тест
app.get("/", (req, res) => {
  res.send("TLV backend alive");
});

// заявка
app.post("/api/lead", (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${SECRET}`) {
    return res.status(401).json({ ok:false, error:"unauthorized" });
  }

  const { name, phone, choice, note } = req.body;

  console.log("=== NEW LEAD ===");
  console.log("Name:", name);
  console.log("Phone:", phone);
  console.log("Package:", choice);
  console.log("Note:", note);
  console.log("================");

  res.json({ ok:true });
});

app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
