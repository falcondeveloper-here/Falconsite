import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// استعمل الـ bin الخاص بيك من JSONBin
const BIN_ID = "68ca8affae596e708ff1abca";
const API_KEY = "$2a$10$mM1Xopbp8M3zQa74yx4JsO1IK337iMzP1pg3mKJe5nzvjhWlZEHH.";

// Get all codes
app.get("/codes", async (req, res) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await response.json();
    res.json(data.record.codes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new code
app.post("/codes", async (req, res) => {
  try {
    const { title, code } = req.body;

    // fetch existing codes
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await response.json();
    let codes = data.record.codes || [];

    // add new code on top
    codes.unshift({ title, code, createdAt: new Date().toISOString() });

    // update bin
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ codes })
    });

    res.json({ success: true, codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));