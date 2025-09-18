// 📁 server.js — StudioHub with Single JSONBin
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔑 JSONBIN CONFIG
const BIN_ID = "68cc0a3a43b1c97be9473409"; // Bin واحد
const API_KEY =
  "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH.";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ------------------- Helpers -------------------
async function getData() {
  const response = await fetch(JSONBIN_URL, {
    method: "GET",
    headers: {
      "X-Master-Key": API_KEY,
      "X-Access-Key": API_KEY,
    },
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  const data = await response.json();
  return data.record || { projects: [], users: [], codes: [] };
}

async function saveData(newData) {
  const response = await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
      "X-Access-Key": API_KEY,
    },
    body: JSON.stringify(newData),
  });
  if (!response.ok) throw new Error(`Save failed: ${response.statusText}`);
  return response.json();
}

// ------------------- PROJECTS -------------------
app.get("/projects", async (req, res) => {
  try {
    const data = await getData();
    res.json(data.projects || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/projects", async (req, res) => {
  try {
    const { title, desc, link } = req.body;
    if (!title || !desc || !link)
      return res.status(400).json({ error: "Title, description and link required" });

    let data = await getData();

    const newProject = {
      id: Date.now().toString(),
      title,
      desc,
      link,
      createdAt: new Date().toISOString(),
    };

    data.projects.unshift(newProject);
    await saveData(data);

    res.status(201).json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- USERS -------------------
app.get("/users", async (req, res) => {
  try {
    const data = await getData();
    res.json(data.users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    let data = await getData();

    if (data.users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password, // ⚠️ للتجربة فقط
      createdAt: new Date().toISOString(),
      role: "user",
    };

    data.users.push(newUser);
    await saveData(data);

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await getData();

    const user = data.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- CODES -------------------
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
    if (!title || !code)
      return res.status(400).json({ error: "Title and code required" });

    let data = await getData();

    const newCode = {
      id: Date.now().toString(),
      title,
      code,
      createdAt: new Date().toISOString(),
    };

    data.codes.unshift(newCode);
    await saveData(data);

    res.json({ success: true, codes: data.codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- PAGES -------------------
app.get("/projects.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "projects.html"));
});

app.get("/admin-share-projects.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-share-projects.html"));
});

app.get("/users.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "users.html"));
});

// ------------------- START -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`👁️  View projects: http://localhost:${PORT}/projects.html`);
  console.log(
    `🔐 Admin: http://localhost:${PORT}/admin-share-projects.html`
  );
  console.log(`👤 Users: http://localhost:${PORT}/users.html`);
});