import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppointmentService } from '../services/appointment.service';
import { generatePostVisitSummary } from '../integrations/ai/gemini';
import { dispatchJob } from '../jobs/queues';
import { holdSlotSchema, confirmSlotSchema, submitConsultationSchema } from '../validators/appointment';
import { z } from 'zod';

const prisma = new PrismaClient();

const rescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  newStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format.'),
  newEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format.'),
});

const formatAppointment = (apt: any) => {
  if (!apt) return null;
  const formatted = { ...apt };
  if (formatted.doctor) {
    formatted.doctor.leaveDays = JSON.parse(formatted.doctor.leaveDays || '[]');
  }
  if (formatted.symptoms) {
    formatted.symptoms.suggestedQuestions = JSON.parse(formatted.symptoms.suggestedQuestions || '[]');
  }
  return formatted;
};

export class AppointmentController {
  static async list(req: Request, res: Response) {
    const { patientId, doctorId } = req.query;
    try {
      const filters: any = {};
      if (patientId && typeof patientId === 'string') filters.patientId = patientId;
      if (doctorId && typeof doctorId === 'string') filters.doctorId = doctorId;

      const list = await prisma.appointment.findMany({
        where: filters,
        include: {
          doctor: true,
          patient: true,
          symptoms: true,
          consultation: true,
          prescription: {
            include: { medications: true },
          },
          aiSummary: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(list.map(formatAppointment));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const apt = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        include: {
          doctor: true,
          patient: true,
          symptoms: true,
          consultation: true,
          prescription: {
            include: { medications: true },
          },
          aiSummary: true,
        },
      });

      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });
      return res.json(formatAppointment(apt));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async hold(req: Request, res: Response) {
    try {
      const parsed = holdSlotSchema.parse(req.body);
      const held = await AppointmentService.holdSlot(
        parsed.doctorId,
        parsed.date,
        parsed.startTime,
        parsed.endTime,
        parsed.patientId
      );
      return res.status(201).json(formatAppointment(held));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'SLOT_NOT_AVAILABLE') {
        return res.status(409).json({ error: 'This time slot is no longer available. Please select another slot.' });
      }
      if (error.message === 'DOCTOR_ON_LEAVE') {
        return res.status(400).json({ error: 'Doctor is on leave on this date.' });
      }
      if (error.message === 'NOT_WORKING_THIS_DAY' || error.message === 'OUTSIDE_WORKING_HOURS') {
        return res.status(400).json({ error: 'Selected time falls outside of the doctor\'s working schedule.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async confirm(req: Request, res: Response) {
    try {
      const parsed = confirmSlotSchema.parse(req.body);
      const confirmed = await AppointmentService.confirmAppointment(req.params.id, parsed.symptoms);
      return res.json(formatAppointment(confirmed));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'HOLD_EXPIRED') {
        return res.status(400).json({ error: 'Appointment hold expired. Please re-book.' });
      }
      if (error.message === 'APPOINTMENT_NOT_HELD') {
        return res.status(400).json({ error: 'Appointment is not in a held state.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async reschedule(req: Request, res: Response) {
    try {
      const parsed = rescheduleSchema.parse(req.body);
      const updated = await AppointmentService.rescheduleAppointment(
        req.params.id,
        parsed.newDate,
        parsed.newStartTime,
        parsed.newEndTime
      );
      return res.json(formatAppointment(updated));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'SLOT_NOT_AVAILABLE') {
        return res.status(409).json({ error: 'This time slot is no longer available. Please select another slot.' });
      }
      if (error.message === 'DOCTOR_ON_LEAVE') {
        return res.status(400).json({ error: 'Doctor is on leave on this date.' });
      }
      if (error.message === 'NOT_WORKING_THIS_DAY' || error.message === 'OUTSIDE_WORKING_HOURS') {
        return res.status(400).json({ error: 'Selected time falls outside of the doctor\'s working schedule.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async cancel(req: Request, res: Response) {
    try {
      await AppointmentService.cancelAppointment(req.params.id);
      return res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'APPOINTMENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async submitConsultation(req: Request, res: Response) {
    try {
      const parsed = submitConsultationSchema.parse(req.body);
      const appointmentId = req.params.id;

      const apt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true },
      });
      if (!apt) return res.status(404).json({ error: 'Appointment not found' });

      // 1. Save Consultation Notes to DB
      await prisma.consultation.create({
        data: {
          appointmentId,
          clinicalNotes: parsed.notes,
        },
      });

      // 2. Save Prescription & Medications
      let prescriptionId = '';
      if (parsed.medications.length > 0 || parsed.followUp) {
        const presc = await prisma.prescription.create({
          data: {
            appointmentId,
            followUpInstructions: parsed.followUp,
          },
        });
        prescriptionId = presc.id;

        await prisma.medication.createMany({
          data: parsed.medications.map(m => ({
            prescriptionId: presc.id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
          })),
        });
      }

      // 3. Queue Medication Reminder Jobs
      if (apt.patient && parsed.medications.length > 0) {
        for (const med of parsed.medications) {
          // Parse duration (e.g. "5 days" or just a number)
          const daysNum = parseInt(med.duration) || 5;
          // Calculate reminders based on frequency (e.g., "2 times/day" -> every 12 hours)
          let frequencyHours = 24;
          if (med.frequency.toLowerCase().includes('2 times')) frequencyHours = 12;
          else if (med.frequency.toLowerCase().includes('3 times')) frequencyHours = 8;

          // Dispatch reminder jobs in the queue
          const timesToSend = (daysNum * 24) / frequencyHours;
          for (let i = 1; i <= timesToSend; i++) {
            const delayTime = i * frequencyHours * 3600 * 1000; // delay in ms
            await dispatchJob(
              'medication-reminder',
              `med-reminder-${apt.id}-${med.name}-${i}`,
              {
                recipientEmail: apt.patient.email,
                patientName: apt.patient.name,
                medicationName: med.name,
                dosage: med.dosage,
                instructions: `Take ${med.dosage} (${med.frequency}). Instruction step ${i} of ${timesToSend}.`,
              },
              { delay: delayTime }
            );
          }
        }
      }

      // 4. Trigger Post-visit AI translation (Failure resilient: if Gemini fails, consultation submission STILL succeeds)
      try {
        const aiSummary = await generatePostVisitSummary(parsed.notes, parsed.medications, parsed.followUp);
        await prisma.aISummary.create({
          data: {
            appointmentId,
            summaryText: aiSummary.summaryText,
            medicationSchedule: aiSummary.medicationSchedule,
            followUpSteps: aiSummary.followUpSteps,
            status: 'SUCCESS',
          },
        });
      } catch (err) {
        console.error('Gemini post-visit summary creation failed:', err);
        // Fallback placeholder record
        await prisma.aISummary.create({
          data: {
            appointmentId,
            summaryText: 'Visit summary is currently being processed by AI.',
            medicationSchedule: parsed.medications.map(m => `- ${m.name}: ${m.dosage}`).join('\n') || 'Review details with physician.',
            followUpSteps: parsed.followUp || 'Return to clinic if symptoms worsen.',
            status: 'FAILED',
          },
        });
      }

      // 5. Complete appointment status
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      return res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}
