import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to format a populated appointment
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

// GET /api/appointments
router.get('/', async (req, res) => {
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
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
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

    if (!apt) return res.status(404).json({ error: 'Appointment not found' });

    return res.json(formatAppointment(apt));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments/hold
router.post('/hold', async (req, res) => {
  const { doctorId, date, startTime, endTime, patientId } = req.body;

  if (!doctorId || !date || !startTime || !endTime || !patientId) {
    return res.status(400).json({ error: 'Missing required hold parameters.' });
  }

  try {
    // Check if slot already confirmed or held
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date,
        startTime,
        OR: [
          { status: 'CONFIRMED' },
          {
            status: 'HELD',
            heldUntil: { gte: new Date() },
          },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'This time slot is no longer available. Please select another slot.' });
    }

    // Set hold expiry to 5 minutes from now
    const heldUntil = new Date(Date.now() + 5 * 60 * 1000);

    const heldApt = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        date,
        startTime,
        endTime,
        status: 'HELD',
        heldUntil,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    return res.status(201).json(formatAppointment(heldApt));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments/:id/confirm
router.post('/:id/confirm', async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms description is required.' });
  }

  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { doctor: true, patient: true },
    });

    if (!apt) return res.status(404).json({ error: 'Appointment hold not found.' });
    if (apt.status !== 'HELD') {
      return res.status(400).json({ error: 'Appointment is not in a confirmable state.' });
    }
    if (apt.heldUntil && new Date(apt.heldUntil).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Appointment hold expired. Please re-book.' });
    }

    // Simulate AI clinical analysis
    const isUrgent = symptoms.toLowerCase().includes('chest pain') || symptoms.toLowerCase().includes('breathing');
    const urgency = isUrgent ? 'High' : (symptoms.length > 50 ? 'Medium' : 'Low');
    const chiefComplaint = symptoms.substring(0, 40) + (symptoms.length > 40 ? '...' : '');
    const suggestedQuestions = [
      'How long have you experienced these specific symptoms?',
      'Does anything make the symptoms feel better or worse?',
      'Have you taken any over-the-counter medications for this?',
    ];

    // Confirm appointment status
    const confirmed = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        heldUntil: null,
        symptoms: {
          create: {
            symptoms,
            urgency,
            chiefComplaint,
            suggestedQuestions: JSON.stringify(suggestedQuestions),
          },
        },
      },
      include: {
        doctor: true,
        patient: true,
        symptoms: true,
      },
    });

    // Create notifications
    if (confirmed.patient) {
      await prisma.notification.create({
        data: {
          recipientEmail: confirmed.patient.email,
          type: 'BOOKING_CONFIRMED',
          message: `Hi ${confirmed.patient.name}, your appointment with ${confirmed.doctor.name} is confirmed for ${confirmed.date} at ${confirmed.startTime}.`,
        },
      });
    }

    await prisma.notification.create({
      data: {
        recipientEmail: confirmed.doctor.email,
        type: 'BOOKING_CONFIRMED',
        message: `Doctor, you have a new appointment with patient ${confirmed.patient?.name || 'Patient'} on ${confirmed.date} at ${confirmed.startTime}.`,
      },
    });

    return res.json(formatAppointment(confirmed));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { doctor: true, patient: true },
    });

    if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

    await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    // Create notifications
    if (apt.patient) {
      await prisma.notification.create({
        data: {
          recipientEmail: apt.patient.email,
          type: 'BOOKING_CANCELLED',
          message: `Your appointment with ${apt.doctor.name} on ${apt.date} at ${apt.startTime} has been cancelled.`,
        },
      });
    }

    await prisma.notification.create({
      data: {
        recipientEmail: apt.doctor.email,
        type: 'BOOKING_CANCELLED',
        message: `Appointment for ${apt.patient?.name || 'Patient'} on ${apt.date} at ${apt.startTime} has been cancelled.`,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments/:id/consultation
router.post('/:id/consultation', async (req, res) => {
  const { notes, medications, followUp } = req.body;

  if (!notes) {
    return res.status(400).json({ error: 'Clinical notes are required.' });
  }

  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });

    // 1. Create Consultation
    await prisma.consultation.create({
      data: {
        appointmentId: req.params.id,
        clinicalNotes: notes,
      },
    });

    // 2. Create Prescription if medications or followUp exist
    if ((medications && medications.length > 0) || followUp) {
      const presc = await prisma.prescription.create({
        data: {
          appointmentId: req.params.id,
          followUpInstructions: followUp || '',
        },
      });

      if (medications && medications.length > 0) {
        await prisma.medication.createMany({
          data: medications.map((m: any) => ({
            prescriptionId: presc.id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
          })),
        });
      }
    }

    // 3. Simulate AI summary creation
    const medList = medications || [];
    const summaryText = `Patient visited regarding clinical concerns. The doctor recommended rest and a specific medication schedule: ${medList.map((m: any) => m.name).join(', ') || 'None'}.`;
    const medicationSchedule = medList.map((m: any) => `- ${m.name}: Take ${m.dosage} ${m.frequency} for ${m.duration}.`).join('\n');
    const followUpSteps = followUp || 'Return to clinic if symptoms worsen.';

    await prisma.aISummary.create({
      data: {
        appointmentId: req.params.id,
        summaryText,
        medicationSchedule,
        followUpSteps,
        status: 'SUCCESS',
      },
    });

    // 4. Update appointment status to COMPLETED
    await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
