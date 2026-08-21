import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'medsync-super-secret-key-12345';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Use admin@medsync.com, doctor@medsync.com, or patient@medsync.com to log in, or register a new patient account.',
      });
    }

    // Verify password if provided
    if (password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password. Please verify your credentials.' });
      }
    } else {
      console.log(`Demo passwordless login allowed for user: ${email}`);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'An error occurred during login.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and Name are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password', 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'PATIENT',
        patientProfile: {
          create: {
            name,
            email: email.toLowerCase(),
          },
        },
      },
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'An error occurred during registration.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { name, email, phone, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required.' });
  }

  try {
    const updateData: any = {
      name,
      email: email.toLowerCase(),
      phone,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    // Update profile accordingly
    if (updatedUser.role === 'PATIENT') {
      await prisma.patientProfile.update({
        where: { userId: req.user.id },
        data: { name, email: email.toLowerCase(), phone },
      });
    } else if (updatedUser.role === 'DOCTOR') {
      await prisma.doctorProfile.update({
        where: { userId: req.user.id },
        data: { name, email: email.toLowerCase(), phone },
      });
    }

    return res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      phone: updatedUser.phone,
      createdAt: updatedUser.createdAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'An error occurred while updating profile.' });
  }
});

export default router;
