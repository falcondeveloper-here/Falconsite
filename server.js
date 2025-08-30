import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// =================== CONFIG ===================
const BIN_ID = "68b28453d0ea881f406afe8b"; // Bin ID متاعك
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const ACCESS_KEY = "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH."; 
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

// -------------- Middleware to check role --------------
async function checkUser Role(req, res, next) {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: "User  not found" });

  req.user = user; // attach user to request

  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: "Access denied: missing role " + role });
    }
    next();
  };
}

// ---------------- ROUTES ----------------

// ✅ تسجيل User
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();

  // نضمنو arrays موجودة
  if (!data.users) data.users = [];

  // شيك إذا كان user موجود
  if (data.users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User  already exists" });
  }

  // زيد user جديد مع roles فارغة
  data.users.push({ username, password, roles: [] });
  await saveData(data);

  res.json({ message: "User  registered successfully" });
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const data = await getData();
  if (!data.users) return res.status(400).json({ error: "No users found" });

  const user = data.users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // Return roles with login success
  res.json({ message: "Login successful", roles: user.roles || [] });
});

// ✅ Get all users with roles (admin only, protected by username+role in body)
app.post("/api/admin/users", checkUser Role, requireRole("Ownership"), async (req, res) => {
  const data = await getData();
  if (!data.users) data.users = [];

  // Return users without passwords
  const safeUsers = data.users.map(u => ({
    username: u.username,
    roles: u.roles || []
  }));

  res.json(safeUsers);
});

// ✅ Update user roles (admin only)
app.post("/api/admin/users/:username/roles", checkUser Role, requireRole("Ownership"), async (req, res) => {
  const targetUsername = req.params.username;
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "Roles must be an array" });
  }

  const validRoles = ["Ownership", "Developer", "Staff", "Team", "GangMode", "FactionMode", "HelperMode", "Ap"];

  const filteredRoles = roles.filter(r => validRoles.includes(r));

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === targetUsername);
  if (!user) return res.status(404).json({ error: "User  not found" });

  user.roles = filteredRoles;
  await saveData(data);

  res.json({ message: `Roles updated for ${user.username}`, roles: filteredRoles });
});

// ✅ Staff Application
app.post("/api/staff", async (req, res) => {
  const { username, reason } = req.body;
  if (!username || !reason)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  if (!data.staffApplications) data.staffApplications = [];

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
  if (!data.helperApplications) data.helperApplications = [];

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
  if (!data.gangApplications) data.gangApplications = [];

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
  if (!data.factionApplications) data.factionApplications = [];

  data.factionApplications.push({ factionName, leader, date: new Date() });
  await saveData(data);

  res.json({ message: "Faction application submitted" });
});

// ✅ Serve HTML pages
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/admin-rank", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-rank.html"));
});

// ✅ TEST route
app.get("/", (req, res) => {
  res.send("✅ Server is running with JSONBin");
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
