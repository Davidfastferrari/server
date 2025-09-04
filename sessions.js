import mongoose from 'mongoose';

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

export default function setupSessionsRoutes(app) {
  app.post('/sessions', async (req, res) => {
    await connectDB();
    const { walletAddress, signedMessage, walletType, delegationHash, requestId, timestamp } = req.body;
    if (!walletAddress || !signedMessage || !walletType) {
      res.status(400).json({ error: 'walletAddress, signedMessage, and walletType are required' });
      return;
    }

    try {
      const session = await Session.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        {
          signedMessage,
          walletType,
          delegationHash,
          requestId,
          timestamp: timestamp || new Date(),
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ message: 'Session saved successfully', session });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save session' });
    }
  });

  app.get('/sessions', async (req, res) => {
    await connectDB();
    try {
      const sessions = await Session.find({});
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });
}
