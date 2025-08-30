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
const BIN_ID = "68b28453d0ea881f406afe8b"; // Your Bin ID
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

// ---------------- ROUTES ----------------

// Simple login: check username & password, return roles if success
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  if (!data.users) return res.status(400).json({ error: "No users found" });

  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ message: "Login successful", roles: user.roles || [] });
});

// Get dashboard stats: total users, total admins, total applications
app.post("/api/admin/stats", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === username);
  if (!user || !user.roles || !user.roles.includes("Ownership")) {
    return res.status(403).json({ error: "Access denied" });
  }

  const totalUsers = data.users.length;
  const totalAdmins = data.users.filter(u => u.roles && u.roles.includes("Ownership")).length;
  const totalApplications = (
    (data.staffApplications?.length || 0) +
    (data.helperApplications?.length || 0) +
    (data.gangApplications?.length || 0) +
    (data.factionApplications?.length || 0)
  );

  res.json({ totalUsers, totalAdmins, totalApplications });
});

// Get all users (for admin)
app.post("/api/admin/users", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === username);
  if (!user || !user.roles || !user.roles.includes("Ownership")) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Return users without passwords
  const safeUsers = data.users.map(u => ({
    username: u.username,
    roles: u.roles || []
  }));

  res.json(safeUsers);
});

// Delete user (admin only)
app.post("/api/admin/users/delete", async (req, res) => {
  const { username, targetUsername } = req.body;
  if (!username || !targetUsername) return res.status(400).json({ error: "Missing fields" });

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === username);
  if (!user || !user.roles || !user.roles.includes("Ownership")) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (username === targetUsername) {
    return res.status(400).json({ error: "You cannot delete yourself" });
  }

  const index = data.users.findIndex(u => u.username === targetUsername);
  if (index === -1) return res.status(404).json({ error: "User  not found" });

  data.users.splice(index, 1);
  await saveData(data);

  res.json({ message: `User  ${targetUsername} deleted` });
});

// Update user roles (admin only)
app.post("/api/admin/users/:targetUsername/roles", async (req, res) => {
  const { username } = req.body;
  const { targetUsername } = req.params;
  const { roles } = req.body;

  if (!username || !roles || !Array.isArray(roles)) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const data = await getData();
  if (!data.users) data.users = [];

  const user = data.users.find(u => u.username === username);
  if (!user || !user.roles || !user.roles.includes("Ownership")) {
    return res.status(403).json({ error: "Access denied" });
  }

  const targetUser  = data.users.find(u => u.username === targetUsername);
  if (!targetUser ) return res.status(404).json({ error: "Target user not found" });

  const validRoles = ["Ownership", "Developer", "Staff", "Team", "GangMode", "FactionMode", "HelperMode", "Ap"];
  targetUser .roles = roles.filter(r => validRoles.includes(r));

  await saveData(data);

  res.json({ message: `Roles updated for ${targetUsername}`, roles: targetUser .roles });
});

// Get all applications (admin only)
app.post("/api/admin/applications", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const data = await getData();

  const user = data.users?.find(u => u.username === username);
  if (!user || !user.roles || !user.roles.includes("Ownership")) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json({
    staffApplications: data.staffApplications || [],
    helperApplications: data.helperApplications || [],
    gangApplications: data.gangApplications || [],
    factionApplications: data.factionApplications || []
  });
});

// Serve frontend pages
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});
app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

// Test route
app.get("/", (req, res) => {
  res.send("✅ Server is running with JSONBin and Admin Dashboard");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
