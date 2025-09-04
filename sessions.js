import fs from 'fs';
import path from 'path';

const sessionsFilePath = path.resolve('./sessions.json');

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { walletAddress, signedMessage, timestamp } = req.body;
    if (!walletAddress || !signedMessage) {
      res.status(400).json({ error: 'walletAddress and signedMessage are required' });
      return;
    }

    let sessions = [];
    try {
      const data = fs.readFileSync(sessionsFilePath, 'utf8');
      sessions = JSON.parse(data);
    } catch (err) {
      // File might not exist, ignore
    }

    const existingIndex = sessions.findIndex(
      (s) => s.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    if (existingIndex !== -1) {
      sessions[existingIndex] = { walletAddress, signedMessage, timestamp: timestamp || Date.now() };
    } else {
      sessions.push({ walletAddress, signedMessage, timestamp: timestamp || Date.now() });
    }

    fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2));

    res.status(200).json({ message: 'Session saved successfully' });
  } else if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(sessionsFilePath, 'utf8');
      const sessions = JSON.parse(data);
      res.status(200).json(sessions);
    } catch (err) {
      res.status(200).json([]);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
