import express from "express";
import fetch from "node-fetch"; // لو تستعمل Node 18+ ما تحتاجهاش
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";   // ✅ مهم باش نخدمو __dirname

// ---------------- FIX __dirname ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ------------------------------------------------

const app = express();
app.use(bodyParser.json());

// =================== CONFIG ===================
const BIN_ID = "68b2c51343b1c97be9306ecd"; // Bin ID متاعك
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const ACCESS_KEY = "$2a$10$OoZiAB9P.tfKYlG7qr6ONOG8U8koWKu1QQwE9jdMnFxo0SDE.GhgC"; // Master Key متاعك
// ==============================================

// ---------------- GET DATA ----------------
async function getData() {
  const res = await fetch(`${JSONBIN_URL}/latest`, {
    headers: { "X-Master-Key": ACCESS_KEY },
  });
  const data = await res.json();
  return data.record;
}

// ---------------- SAVE DATA ----------------
async function saveData(newData) {
  await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": ACCESS_KEY,
    },
    body: JSON.stringify(newData),
  });
}

// ---------------- ROUTES ----------------

// ✅ تسجيل User
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();

  if (!data.users) data.users = []; // ✅ نضمن array موجودة

  if (data.users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  data.users.push({ username, email, password });
  await saveData(data);

  res.json({ message: "User registered successfully" });
});

// ✅ Login User
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const data = await getData();
    if (!data.users) data.users = [];

    const user = data.users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Staff Application
app.post("/api/staff", async (req, res) => {
  const { username, reason } = req.body;
  if (!username || !reason)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  data.staffApplications.push({ username, reason, date: new Date() });
  await saveData(data);

  res.json({ message: "Staff application submitted" });
});

// ✅ Helper Application
app.post("/api/helper", async (req, res) => {
  const { username, reason } = req.body;
  if (!username || !reason)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  data.helperApplications.push({ username, reason, date: new Date() });
  await saveData(data);

  res.json({ message: "Helper application submitted" });
});

// ✅ Gang Application
app.post("/api/gang", async (req, res) => {
  const { gangName, leader } = req.body;
  if (!gangName || !leader)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  data.gangApplications.push({ gangName, leader, date: new Date() });
  await saveData(data);

  res.json({ message: "Gang application submitted" });
});

// ✅ Faction Application
app.post("/api/faction", async (req, res) => {
  const { factionName, leader } = req.body;
  if (!factionName || !leader)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  data.factionApplications.push({ factionName, leader, date: new Date() });
  await saveData(data);

  res.json({ message: "Faction application submitted" });
});

// ✅ Admin: Get all users
app.get("/api/admin/users", async (req, res) => {
  try {
    const data = await getData();
    res.json(data.users || []);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Admin: Update user roles
app.post("/api/admin/users/:username/roles", async (req, res) => {
  const { username } = req.params;
  const { roles } = req.body;

  try {
    const data = await getData();
    const user = data.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.roles = roles; // Update roles
    await saveData(data);

    res.json({ message: "Roles updated", user });
  } catch (err) {
    console.error("Error updating roles:", err);
    res.status(500).json({ error: "Failed to update roles" });
  }
});

// ---------------- STATIC ROUTES ----------------
app.get('/faction-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faction-application.html'));
});
app.get('/faction-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faction-applications-view.html'));
});

app.get('/gang-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gang-application.html'));
});
app.get('/gang-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gang-applications-view.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});
app.get('/admin-rank', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-rank.html'));
});

// ✅ TEST route
app.get("/", (req, res) => {
  res.send("✅ Server is running with JSONBin");
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
