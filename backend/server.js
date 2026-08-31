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