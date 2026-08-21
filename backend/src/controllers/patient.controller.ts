import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PatientController {
  static async getProfile(req: Request, res: Response) {
    try {
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: req.params.userId },
      });
      if (!patient) return res.json(null);
      return res.json(patient);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
