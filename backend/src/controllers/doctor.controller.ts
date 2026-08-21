import { Request, Response } from 'express';
import { DoctorService } from '../services/doctor.service';
import { createDoctorSchema, updateDoctorSchema } from '../validators/doctor';

export class DoctorController {
  static async list(req: Request, res: Response) {
    try {
      const list = await DoctorService.listDoctors();
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const doc = await DoctorService.getDoctor(req.params.id);
      return res.json(doc);
    } catch (error: any) {
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = createDoctorSchema.parse(req.body);
      const doc = await DoctorService.createDoctor(
        parsed.email,
        parsed.name,
        parsed.specialization,
        parsed.slotDuration
      );
      return res.status(201).json(doc);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'EMAIL_ALREADY_IN_USE') {
        return res.status(400).json({ error: 'Email address is already in use.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const parsed = updateDoctorSchema.parse(req.body);
      await DoctorService.updateDoctor(req.params.id, parsed);
      return res.json({ message: 'Doctor profile updated successfully.' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor profile not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAvailability(req: Request, res: Response) {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD).' });
    }
    try {
      const slots = await DoctorService.getAvailability(req.params.id, date);
      return res.json(slots);
    } catch (error: any) {
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async setLeave(req: Request, res: Response) {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required.' });
    try {
      const count = await DoctorService.setLeave(req.params.id, date);
      return res.json({ affectedAppointmentsCount: count });
    } catch (error: any) {
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async setLeaveRange(req: Request, res: Response) {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required.' });
    }
    try {
      const count = await DoctorService.setLeaveRange(req.params.id, startDate, endDate);
      return res.json({ affectedAppointmentsCount: count });
    } catch (error: any) {
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async cancelLeave(req: Request, res: Response) {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required.' });
    try {
      await DoctorService.cancelLeaveEarly(req.params.id, date);
      return res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'DOCTOR_NOT_FOUND') {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async getLeaveHistory(req: Request, res: Response) {
    try {
      const leaves = await DoctorService.getLeaves(req.params.id);
      return res.json(leaves);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
