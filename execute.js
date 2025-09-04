import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malicious-rewards';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const SessionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  signedMessage: { type: String, required: true },
  walletType: { type: String, required: true },
  delegationHash: { type: String },
  requestId: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (err) {
    return null;
  }
}

export default function setupExecuteRoutes(app) {
  app.post('/execute', async (req, res) => {
    await connectDB();
    const user = authenticateToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { walletAddress, action } = req.body;
    if (!walletAddress || !action) {
      res.status(400).json({ error: 'walletAddress and action are required' });
      return;
    }

    try {
      const session = await Session.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Placeholder for transaction execution
      console.log(`Executing ${action} for ${walletAddress} using ${session.walletType} wallet`);
      console.log('Session data:', session);

      // Simulate transaction
      const transactionResult = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'success',
        action,
        walletAddress,
        walletType: session.walletType,
        timestamp: new Date(),
      };

      res.status(200).json({ message: 'Transaction executed successfully', transaction: transactionResult });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute transaction' });
    }
  });
}
