import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
    users.push({ username, email, password: hashedPassword, createdAt: new Date().toISOString() });
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
    // For demo, just respond success (no session management here)
    res.json({ message: `Welcome back, ${user.username}!` });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// --- Staff Application Routes ---

app.get('/staff-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-application.html'));
});
app.get('/staff-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-applications-view.html'));
});
app.post('/api/staff-applications', (req, res) => {
  const { username, age, discord, role, experience, motivation } = req.body;
  if (!username || !age || !discord || !role || !experience || !motivation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const application = {
    username,
    age,
    discord,
    role,
    experience,
    motivation,
    date: new Date().toISOString()
  };
  staffApplications.push(application);
  res.status(201).json({ message: 'Staff application submitted' });
});
app.get('/api/staff-applications', (req, res) => {
  res.json(staffApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// --- Helper Application Routes ---

app.get('/helper-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-application.html'));
});
app.get('/helper-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-applications-view.html'));
});
app.post('/api/helper-applications', (req, res) => {
  const { username, age, discord, experience, motivation } = req.body;
  if (!username || !age || !discord || !experience || !motivation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const application = {
    username,
    age,
    discord,
    experience,
    motivation,
    date: new Date().toISOString()
  };
  helperApplications.push(application);
  res.status(201).json({ message: 'Helper application submitted' });
});
app.get('/api/helper-applications', (req, res) => {
  res.json(helperApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// --- Gang Application Routes ---

app.get('/gang-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gang-application.html'));
});
app.get('/gang-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gang-applications-view.html'));
});
app.post('/api/gang-applications', (req, res) => {
  const { username, age, discord, gangName, experience, motivation } = req.body;
  if (!username || !age || !discord || !gangName || !experience || !motivation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const application = {
    username,
    age,
    discord,
    gangName,
    experience,
    motivation,
    date: new Date().toISOString()
  };
  gangApplications.push(application);
  res.status(201).json({ message: 'Gang application submitted' });
});
app.get('/api/gang-applications', (req, res) => {
  res.json(gangApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// --- Faction Application Routes ---

app.get('/faction-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faction-application.html'));
});
app.get('/faction-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faction-applications-view.html'));
});
app.post('/api/faction-applications', (req, res) => {
  const { username, age, discord, factionName, experience, motivation } = req.body;
  if (!username || !age || !discord || !factionName || !experience || !motivation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const application = {
    username,
    age,
    discord,
    factionName,
    experience,
    motivation,
    date: new Date().toISOString()
  };
  factionApplications.push(application);
  res.status(201).json({ message: 'Faction application submitted' });
});
app.get('/api/faction-applications', (req, res) => {
  res.json(factionApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// Homepage route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
