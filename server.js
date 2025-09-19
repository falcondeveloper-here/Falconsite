// 📁 server.js — StudioHub with Single JSONBin
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simple admin authentication middleware
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'admin123';
  
  // Admin key check (in production, use proper JWT/session auth)
  if (adminKey === expectedKey || req.path.includes('/login')) {
    next();
  } else {
    res.status(401).json({ error: 'Admin authentication required' });
  }
}

// 🔑 JSONBIN CONFIG (use environment variables in production)
const BIN_ID = process.env.JSONBIN_BIN_ID || "68cc0a3a43b1c97be9473409";
const API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH.";
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
    const { search, page = 1, limit = 10 } = req.query;
    let projects = data.projects || [];

    // Search functionality
    if (search) {
      projects = projects.filter(project => 
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
      );
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProjects = projects.slice(startIndex, endIndex);

    res.json({
      projects: paginatedProjects,
      total: projects.length,
      page: parseInt(page),
      totalPages: Math.ceil(projects.length / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/projects", requireAdmin, async (req, res) => {
try {
const { title, description, imageUrl, liveUrl, githubUrl, tags } = req.body;
if (!title || !description)
return res.status(400).json({ error: "Title and description required" });

let data = await getData();  

const newProject = {  
  id: Date.now().toString(),  
  title,  
  description,  
  imageUrl:  
    imageUrl ||  
    "https://via.placeholder.com/400x200/1a1a1a/ff5e1a?text=Project+Preview",  
  liveUrl: liveUrl || "#",  
  githubUrl: githubUrl || "#",  
  tags: tags || [],  
  createdAt: new Date().toISOString(),  
};  

data.projects.unshift(newProject);  
await saveData(data);  

res.status(201).json({ success: true, project: newProject });

} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.put("/projects/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, liveUrl, githubUrl, tags } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    let data = await getData();
    const projectIndex = data.projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    data.projects[projectIndex] = {
      ...data.projects[projectIndex],
      title,
      description,
      imageUrl: imageUrl || "https://via.placeholder.com/400x200/1a1a1a/ff5e1a?text=Project+Preview",
      liveUrl: liveUrl || "#",
      githubUrl: githubUrl || "#",
      tags: tags || [],
      updatedAt: new Date().toISOString()
    };

    await saveData(data);
    res.json({ success: true, project: data.projects[projectIndex] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/projects/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let data = await getData();
    
    const projectIndex = data.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    data.projects.splice(projectIndex, 1);
    await saveData(data);
    
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- ADMIN STATS -------------------
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const data = await getData();
    const projects = data.projects || [];
    const codes = data.codes || [];
    const users = data.users || [];

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentProjects = projects.filter(p => new Date(p.createdAt) >= sevenDaysAgo).length;
    const recentCodes = codes.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const recentUsers = users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;

    // Generate time series data for charts
    const timeseries = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayProjects = projects.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate >= dayStart && pDate < dayEnd;
      }).length;
      
      const dayCodes = codes.filter(c => {
        const cDate = new Date(c.createdAt);
        return cDate >= dayStart && cDate < dayEnd;
      }).length;
      
      const dayUsers = users.filter(u => {
        const uDate = new Date(u.createdAt);
        return uDate >= dayStart && uDate < dayEnd;
      }).length;

      timeseries.push({
        date: date.toISOString().split('T')[0],
        projects: dayProjects,
        codes: dayCodes,
        users: dayUsers
      });
    }

    res.json({
      totals: {
        projects: projects.length,
        codes: codes.length,
        users: users.length
      },
      recent: {
        projects: recentProjects,
        codes: recentCodes,
        users: recentUsers
      },
      timeseries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- USERS -------------------
app.get("/users", requireAdmin, async (req, res) => {
  try {
    const data = await getData();
    const { search, page = 1, limit = 10 } = req.query;
    let users = data.users || [];

    // Search functionality
    if (search) {
      users = users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Remove password from response for security
    users = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      total: users.length,
      page: parseInt(page),
      totalPages: Math.ceil(users.length / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/signup", requireAdmin, async (req, res) => {
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

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- CODES -------------------
app.get("/codes", async (req, res) => {
  try {
    const data = await getData();
    const { search, page = 1, limit = 10 } = req.query;
    let codes = data.codes || [];

    // Search functionality
    if (search) {
      codes = codes.filter(code => 
        code.title.toLowerCase().includes(search.toLowerCase()) ||
        code.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCodes = codes.slice(startIndex, endIndex);

    res.json({
      codes: paginatedCodes,
      total: codes.length,
      page: parseInt(page),
      totalPages: Math.ceil(codes.length / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/codes", requireAdmin, async (req, res) => {
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

app.put("/codes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code } = req.body;
    
    if (!title || !code) {
      return res.status(400).json({ error: "Title and code required" });
    }

    let data = await getData();
    const codeIndex = data.codes.findIndex(c => c.id === id);
    
    if (codeIndex === -1) {
      return res.status(404).json({ error: "Code snippet not found" });
    }

    data.codes[codeIndex] = {
      ...data.codes[codeIndex],
      title,
      code,
      updatedAt: new Date().toISOString()
    };

    await saveData(data);
    res.json({ success: true, code: data.codes[codeIndex] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/codes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let data = await getData();
    
    const codeIndex = data.codes.findIndex(c => c.id === id);
    if (codeIndex === -1) {
      return res.status(404).json({ error: "Code snippet not found" });
    }

    data.codes.splice(codeIndex, 1);
    await saveData(data);
    
    res.json({ success: true, message: "Code snippet deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, username } = req.body;
    
    let data = await getData();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== data.users[userIndex].username) {
      const existingUser = data.users.find(u => u.username === username && u.id !== id);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      data.users[userIndex].username = username;
    }

    if (role) {
      data.users[userIndex].role = role;
    }

    data.users[userIndex].updatedAt = new Date().toISOString();

    await saveData(data);
    
    const { password, ...userWithoutPassword } = data.users[userIndex];
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let data = await getData();
    
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting admin users
    if (data.users[userIndex].role === 'admin') {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    data.users.splice(userIndex, 1);
    await saveData(data);
    
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- ADMIN AUTH -------------------
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await getData();

    const user = data.users.find(
      (u) => u.username === username && u.password === password && u.role === 'admin'
    );
    
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const { password: userPassword, ...adminUser } = user;
    res.json({ success: true, user: adminUser });
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

app.get("/admin-dashboard.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/admin-share-codes.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-share-codes.html"));
});

// ------------------- START -------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`👁️  View projects: http://0.0.0.0:${PORT}/projects.html`);
  console.log(
    `🔐 Admin: http://0.0.0.0:${PORT}/admin-share-projects.html`
  );
  console.log(`👤 Users: http://0.0.0.0:${PORT}/users.html`);
});