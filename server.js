// 📁 server.js — NO .env, NO dotenv
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔑 HARD CODED JSONBIN CREDENTIALS — REPLACE THESE WITH YOUR OWN
const BIN_ID = "68ca8affae596e708ff1abca"; // ⚠️ REPLACE THIS
const API_KEY = "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH."; // ⚠️ REPLACE THIS

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// 🌐 GET /projects → Fetch all projects
app.get('/projects', async (req, res) => {
  try {
    const response = await fetch(JSONBIN_URL, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY,
        'X-Access-Key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`JSONBin error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data.record || []);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// ➕ POST /projects → Add new project
app.post('/projects', async (req, res) => {
  try {
    const { title, description, imageUrl, liveUrl, githubUrl, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    // Fetch current data
    const currentResponse = await fetch(JSONBIN_URL, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY
      }
    });

    if (!currentResponse.ok) {
      throw new Error('Failed to fetch current data');
    }

    const currentData = await currentResponse.json();
    const projects = Array.isArray(currentData.record) ? currentData.record : [];

    // Add new project
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

    // Save back to JSONBin
    const saveResponse = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
        'X-Access-Key': API_KEY
      },
      body: JSON.stringify(projects)
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save to JSONBin');
    }

    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save project' });
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
  console.log(`👁️  View projects: http://localhost:${PORT}/projects.html`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin-share-projects.html`);
  console.log(`⚠️  REMEMBER: Replace BIN_ID and API_KEY in server.js with your JSONBin keys!`);
});