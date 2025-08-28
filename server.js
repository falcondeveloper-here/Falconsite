const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public")); // serve html/css/js

const NOTES_FILE = path.join(__dirname, "notes.json");

// get all notes
app.get("/api/notes", (req, res) => {
  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data || "[]"));
  });
});

// add note
app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;
  const newNote = {
    title,
    content,
    date: new Date().toLocaleString()
  };

  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    let notes = [];
    if (!err && data) notes = JSON.parse(data);
    notes.unshift(newNote); // add new note at top
    fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), () => {
      res.json({ success: true, note: newNote });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
