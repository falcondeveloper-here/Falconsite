import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔑 إعدادات JSONBin
const BIN_ID = "68ca8affae596e708ff1abca";
const API_KEY = "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH.";

// 📌 جلب البيانات من JSONBin
async function getData() {
  const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { "X-Master-Key": API_KEY },
  });
  const data = await response.json();
  return data.record || { users: [], codes: [] };
}

// 📌 حفظ البيانات في JSONBin
async function saveData(record) {
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
    },
    body: JSON.stringify(record),
  });
}

// ✅ SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    let data = await getData();

    // check if username موجود
    if (data.users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // توليد ID unique
    const id = "UID-" + Math.floor(Math.random() * 1000000);

    data.users.push({ id, username, password });
    await saveData(data);

    res.json({ success: true, id, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    let data = await getData();

    const user = data.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ success: true, id: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ codes routes متاعك (ما مسستهاش)
app.get("/codes", async (req, res) => {
  try {
    const data = await getData();
    res.json(data.codes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/codes", async (req, res) => {
  try {
    const { title, code } = req.body;
    let data = await getData();

    data.codes.unshift({ title, code, createdAt: new Date().toISOString() });
    await saveData(data);

    res.json({ success: true, codes: data.codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () =>
  console.log("🚀 Server running on http://localhost:3000")
);