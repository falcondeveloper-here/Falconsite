import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup (in-memory store for demo; use a persistent store in production)
app.use(session({
  secret: 'your-secret-key', // change this to a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if using HTTPS
}));

// In-memory storage (replace with DB in production)
const users = [];
const staffApplications = [];
const helperApplications = [];
const gangApplications = [];
const factionApplications = [];

// Helper function to find user by username
function findUser (username) {
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Middleware to check if user is admin (Ownership role)
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.roles && req.session.user.roles.includes('Ownership')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admins only' });
  }
}

// --- Signup/Login Routes ---

// Signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup API
app.post('/api/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (findUser (username)) {
    return res.status(400).json({ error: 'Username already taken.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Default role is empty array
    users.push({ username, email, password: hashedPassword, roles: [], createdAt: new Date().toISOString() });
    res.status(201).json({ message: 'User  registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const user = findUser (username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }
  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    // Save user info in session (excluding password)
    req.session.user = {
      username: user.username,
      email: user.email,
      roles: user.roles,
      createdAt: user.createdAt
    };
    res.json({ message: `Welcome back, ${user.username}!`, user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Logout API
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// --- Admin Rank Page ---

// Serve admin-rank page (only for admins)
app.get('/admin-rank', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-rank.html'));
});

// API to get all users (admin only)
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
  // Return users without passwords
  const safeUsers = users.map(u => ({
    username: u.username,
    email: u.email,
    roles: u.roles,
    createdAt: u.createdAt
  }));
  res.json(safeUsers);
});

// API to update user roles (admin only)
app.post('/api/admin/users/:username/roles', isAuthenticated, isAdmin, (req, res) => {
  const targetUsername = req.params.username;
  const { roles } = req.body;
  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: 'Roles must be an array.' });
  }
  const user = findUser (targetUsername);
  if (!user) {
    return res.status(404).json({ error: 'User  not found.' });
  }
  // Validate roles: only allow known roles
  const validRoles = ['Ownership', 'Developer', 'Staff', 'Team', 'GangMode', 'FactionMode', 'HelperMode', 'Ap'];
  const filteredRoles = roles.filter(r => validRoles.includes(r));
  user.roles = filteredRoles;

  // If the updated user is the logged-in user, update session roles too
  if (req.session.user && req.session.user.username === user.username) {
    req.session.user.roles = filteredRoles;
  }

  res.json({ message: `Roles updated for ${user.username}`, roles: filteredRoles });
});

// --- Other application routes (staff, helper, gang, faction) ---
// (You can copy your existing routes here, omitted for brevity)

// Homepage route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
