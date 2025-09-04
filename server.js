import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import setupAuthRoutes from './auth.js';
import setupSessionsRoutes from './sessions.js';
import setupExecuteRoutes from './execute.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Setup routes
setupAuthRoutes(app);
setupSessionsRoutes(app);
setupExecuteRoutes(app);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Malicious Rewards Backend API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
