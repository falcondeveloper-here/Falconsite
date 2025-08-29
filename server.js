import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (replace with DB in production)
const staffApplications = [];
const helperApplications = [];

// Serve staff application form page
app.get('/staff-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-application.html'));
});

// Serve staff applications view page
app.get('/staff-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-applications-view.html'));
});

// API: Get all staff applications (newest first)
app.get('/api/staff-applications', (req, res) => {
  // Return newest first
  res.json(staffApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// API: Submit staff application
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

// Serve helper application form page
app.get('/helper-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-application.html'));
});

// Serve helper applications view page
app.get('/helper-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-applications-view.html'));
});

// API: Get all helper applications (newest first)
app.get('/api/helper-applications', (req, res) => {
  res.json(helperApplications.slice().sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// API: Submit helper application
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

// Serve homepage or other routes as needed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/helper-application', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-application.html'));
});
app.get('/helper-applications-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helper-applications-view.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
