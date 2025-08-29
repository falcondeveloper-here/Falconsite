const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Database setup
const dbFile = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbFile);

// Create staff applications table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS staff_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      age INTEGER NOT NULL,
      discord TEXT NOT NULL,
      role TEXT NOT NULL,
      experience TEXT NOT NULL,
      motivation TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);
});

// API: Get all staff applications
app.get("/api/staff-applications", (req, res) => {
  db.all("SELECT * FROM staff_applications ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// API: Add new staff application
app.post("/api/staff-applications", (req, res) => {
  const { username, age, discord, role, experience, motivation } = req.body;
  if (!username || !age || !discord || !role || !experience || !motivation) {
    return res.status(400).json({ error: "All fields required" });
  }
  const date = new Date().toISOString().split("T")[0];
  db.run(
    `INSERT INTO staff_applications 
    (username, age, discord, role, experience, motivation, date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, age, discord, role, experience, motivation, date],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert error" });
      res.json({ id: this.lastID, username, age, discord, role, experience, motivation, date });
    }
  );
});

// Serve pages
app.get("/staff-application", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "staff-application.html"));
});

app.get("/staff-applications-view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "staff-applications-view.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
