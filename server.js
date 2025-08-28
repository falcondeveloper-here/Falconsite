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

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patch_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);
});

// API: Get all patch notes
app.get("/api/notes", (req, res) => {
  db.all("SELECT * FROM patch_notes ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// API: Add new patch note
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

// Serve pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/patch-notes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patch-notes.html"));
});

app.get("/admin-patch-notes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminpatchnotes.html"));
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stats.html"));
});

app.get("/aboutus", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "aboutus.html"));
});

app.get("/applications", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "applications.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
