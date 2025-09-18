// 📁 server.js — مع users, projects, codes
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // لازم تثبّتو: npm i node-fetch

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔑 JSONBIN CREDENTIALS
const BIN_ID = "68cc0a3a43b1c97be9473409";
const API_KEY = "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH.";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// 🔧 Helpers
async function getData() {
  const response = await fetch(JSONBIN_URL + "/latest", {
    headers: { "X-Master-Key": API_KEY }
  });
  if (!response.ok) throw new Error("Failed to fetch from JSONBin");
  const data = await response.json();
  return data.record || { projects: [], codes: [], users: [] };
}

async function saveData(data) {
  const response = await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to save to JSONBin");
}

// 🌐 PROJECTS
app.get('/projects', async (req, res) => {
  try {
    const data = await getData();
    res.json(data.projects || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { title, description, imageUrl, liveUrl, githubUrl, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    const data = await getData();
    const projects = data.projects || [];

    const newProject = {
      id: Date.now().toString(),
      title,
      description,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x200/1a1a1a/ff5e1a?text=Project+Preview',
      liveUrl: liveUrl || '#',
      githubUrl: githubUrl || '#',
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    projects.unshift(newProject);
    data.projects = projects;
    await saveData(data);

    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// 🌐 CODES
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

    data.codes = data.codes || [];
    data.codes.unshift({ title, code, createdAt: new Date().toISOString() });
    await saveData(data);

    res.json({ success: true, codes: data.codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌐 USERS
// ➕ Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "All fields required" });

    let data = await getData();
    data.users = data.users || [];

    // check duplicate
    if (data.users.find(u => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password, // ⚠️ حطها plain text. ممكن نزيدو hashing ب bcrypt
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    await saveData(data);

    res.json({ success: true, user: { id: newUser.id, username: newUser.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔑 Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "All fields required" });

    let data = await getData();
    const user = (data.users || []).find(u => u.username === username && u.password === password);

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👀 Get all users (مثلا للـ admin)
app.get("/users", async (req, res) => {
  try {
    const data = await getData();
    res.json(data.users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🏠 Serve Pages
app.get('/projects.html', (req, res) => {
  res.sendFile(__dirname + '/public/projects.html');
});

app.get('/admin-share-projects.html', (req, res) => {
  res.sendFile(__dirname + '/public/admin-share-projects.html');
});

// 🎉 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});