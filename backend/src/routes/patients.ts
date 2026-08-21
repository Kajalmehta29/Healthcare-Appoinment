import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/patients/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.params.userId },
    });

    if (!patient) {
      return res.json(null);
    }
    return res.json(patient);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
