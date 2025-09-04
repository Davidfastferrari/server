import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import setupAuthRoutes from './pages/api/auth.js';
import setupSessionsRoutes from './pages/api/sessions.js';
import setupExecuteRoutes from './pages/api/execute.js';

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
