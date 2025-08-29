import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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
const staffApplications = [];
const helperApplications = [];
const gangApplications = [];

// Staff application routes
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

// Helper application routes
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

// Gang application routes
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

// Homepage route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
