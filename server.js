// server.js
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

// Create tables if not exists
db.serialize(() => {
  // Patch Notes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS patch_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);

  // Staff Applications Table
  db.run(`
    CREATE TABLE IF NOT EXISTS staff_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      discord TEXT NOT NULL,
      role TEXT NOT NULL,
      experience TEXT NOT NULL,
      motivation TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);
});

// ------------------- PATCH NOTES API -------------------
app.get("/api/notes", (req, res) => {
  db.all("SELECT * FROM patch_notes ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content required" });
  }
  const date = new Date().toISOString().split("T")[0];
  db.run(
    "INSERT INTO patch_notes (title, content, date) VALUES (?, ?, ?)",
    [title, content, date],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert error" });
      res.json({ id: this.lastID, title, content, date });
    }
  );
});

// ------------------- STAFF APPLICATIONS API -------------------
app.get("/api/staff-applications", (req, res) => {
  db.all("SELECT * FROM staff_applications ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.post("/api/staff-applications", (req, res) => {
  const { name, age, discord, role, experience, motivation } = req.body;
  if (!name || !age || !discord || !role || !experience || !motivation) {
    return res.status(400).json({ error: "All fields required" });
  }
  const date = new Date().toISOString().split("T")[0];
  db.run(
    "INSERT INTO staff_applications (name, age, discord, role, experience, motivation, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, age, discord, role, experience, motivation, date],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert error" });
      res.json({ id: this.lastID, name, age, discord, role, experience, motivation, date });
    }
  );
});

// ------------------- SERVE PAGES -------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/staff-application", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "staff-application.html"));
});

// ------------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
