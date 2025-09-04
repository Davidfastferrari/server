const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4000;
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

app.use(cors());
app.use(bodyParser.json());

// Load sessions from file or initialize empty array
function loadSessions() {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save sessions to file
function saveSessions(sessions) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// API to add a new session
app.post('/api/sessions', (req, res) => {
  const { walletAddress, signedMessage, timestamp } = req.body;
  if (!walletAddress || !signedMessage) {
    return res.status(400).json({ error: 'walletAddress and signedMessage are required' });
  }

  const sessions = loadSessions();

  // Check if session for walletAddress already exists, update if so
  const existingIndex = sessions.findIndex(s => s.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  if (existingIndex !== -1) {
    sessions[existingIndex] = { walletAddress, signedMessage, timestamp: timestamp || Date.now() };
  } else {
    sessions.push({ walletAddress, signedMessage, timestamp: timestamp || Date.now() });
  }

  saveSessions(sessions);
  res.json({ message: 'Session saved successfully' });
});

// API to get all sessions (admin)
app.get('/api/sessions', (req, res) => {
  const sessions = loadSessions();
  res.json(sessions);
});

// Serve static files (optional, if you want to serve frontend from here)
app.use(express.static(path.join(__dirname, '../')));

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
