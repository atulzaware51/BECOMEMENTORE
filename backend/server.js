const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors()); // Allows your HTML frontend to talk to this backend
app.use(express.json()); // Parses incoming JSON data securely







// ROUTE 1: Submit a new mentor application (For the Frontend Form)
app.post('/api/applications', async (req, res) => {
  try {
    const { fullName, email, phone, areaOfInterest, mentorshipFocus, bio } = req.body;

    // Save to Neon Database via Prisma
    const newApplication = await prisma.application.create({
      data: {fullName,email,phone,areaOfInterest,mentorshipFocus,bio,},});

    res.status(201).json({ message: "Form submitted successfully", data: newApplication });
  } catch (error) {
    // Handle unique email constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "An application with this email already exists." });
    }
    res.status(500).json({ error: "Server error during submission." });
  }
});





// ROUTE 2: Fetch all applications (For the Admin Dashboard)
app.get('/api/admin/applications', async (req, res) => {
  try {
    // Fetches all applications, ordered by newest first
    const applications = await prisma.application.findMany({
      orderBy: { submittedAt: 'desc' }
    });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// --- NEW: LOGIN ROUTE ---
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- NEW: AUTH MIDDLEWARE ---
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Access denied" });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    next();
  });
};










// ROUTE 3: Update application status (For Admin Actions)
app.patch('/api/admin/applications/:id/status', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const { status } = req.body;

    // Validate status against Prisma Enum
    const validStatuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: appId },
      data: { status: status }
    });

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status." });
  }
});
const crypto = require('crypto');
const { ethers } = require('ethers');

// Setup Blockchain Connection Provider
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

// A simple interface matching a standard storage Smart Contract
const contractABI = ["function storeHash(string memory dataHash) public returns (uint256)"];
const contract = new ethers.Contract(process.env.BLOCKCHAIN_CONTRACT_ADDRESS, contractABI, wallet);




// -------------------v4-----------------

app.patch('/api/admin/applications/:id/status', authenticateAdmin, async (req, res) => {
  try {
    // 1. Strict ID Validation
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({ error: "Invalid application ID format." });
    }

    // 2. Strict Input Whitelisting (Prevent arbitrary string injection)
    const { status } = req.body; 
    const allowedStatuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value provided." });
    }

    // 3. Resource Existence Check (Prevents unhandled Prisma crash errors)
    const existingApp = await prisma.application.findUnique({
      where: { id: appId }
    });

    if (!existingApp) {
      return res.status(404).json({ error: "Application not found." });
    }

    // 4. Idempotency Check (Prevent duplicate blockchain writes if already accepted)
    const wasAlreadyAccepted = existingApp.status === 'ACCEPTED';

    // 5. Update the database securely via Prisma
    const updatedApplication = await prisma.application.update({
      where: { id: appId },
      data: { status: status }
    });

    let blockchainData = null;
    let actionMessage = "";

    // 6. Conditional Blockchain Handling with Re-entrancy protection
    if (status === 'ACCEPTED' && !wasAlreadyAccepted) {
      // Create secure anonymous fingerprint (SHA-256)
      const rawData = `${updatedApplication.id}-${updatedApplication.email}-${updatedApplication.status}`;
      const dataHash = crypto.createHash('sha256').update(rawData).digest('hex');
      
      console.log(`Securing hash to blockchain: ${dataHash}`);

      // Send to local Hardhat node or Polygon network
      const tx = await contract.storeHash(dataHash);
      const receipt = await tx.wait();

      blockchainData = {
        dataHash: dataHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
      actionMessage = "Mentor Approved: Cryptographic proof successfully engraved on-chain.";
    } else if (status === 'ACCEPTED' && wasAlreadyAccepted) {
      actionMessage = "Status is already ACCEPTED. Blockchain write skipped to prevent redundant gas fees.";
    } else {
      // For REJECTED, REVIEWING, or PENDING
      actionMessage = `Status updated to ${status}. Stored securely in database audit logs.`;
    }

    res.status(200).json({ 
      application: updatedApplication,
      blockchain: blockchainData,
      message: actionMessage 
    });

  } catch (error) {
    // Log the actual error internally for debugging, but never leak system stack traces to the client
    console.error("Secure status update error:", error);
    res.status(500).json({ error: "Failed to process application update securely." });
  }
});

//------------------------------- v3--------------------------
// app.patch('/api/admin/applications/:id/status', authenticateAdmin, async (req, res) => {
//   try {
//     const appId = parseInt(req.params.id);
//     const { status } = req.body; // PENDING, REVIEWING, ACCEPTED, REJECTED

//     // 1. Update the traditional database
//     const updatedApplication = await prisma.application.update({
//       where: { id: appId },
//       data: { status: status }
//     });

//     let blockchainData = null;
//     let actionMessage = "";

//     // 2. Conditional Blockchain Handling
//     if (status === 'ACCEPTED') {
//       // Create secure anonymous fingerprint (SHA-256)
//       const rawData = `${updatedApplication.id}-${updatedApplication.email}-${updatedApplication.status}`;
//       const dataHash = crypto.createHash('sha256').update(rawData).digest('hex');
      
//       console.log(`Securing hash to blockchain: ${dataHash}`);

//       // Send to local Hardhat node or Polygon
//       const tx = await contract.storeHash(dataHash);
//       const receipt = await tx.wait();

//       blockchainData = {
//         dataHash: dataHash,
//         txHash: receipt.hash,
//         blockNumber: receipt.blockNumber
//       };
//       actionMessage = "Mentor Approved: Cryptographic proof successfully engraved on-chain.";
//     } else {
//       // For REJECTED, REVIEWING, or PENDING
//       actionMessage = `Status updated to ${status}. Stored securely in database audit logs (Blockchain write skipped for privacy/efficiency).`;
//     }

//     res.status(200).json({ 
//       application: updatedApplication,
//       blockchain: blockchainData,
//       message: actionMessage 
//     });

//   } catch (error) {
//     console.error("Status update error:", error);
//     res.status(500).json({ error: "Failed to process application update." });
//   }
// });
