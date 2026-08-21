import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to generate slots
const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number): string[] => {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const endMinutes = endH * 60 + endM;
  let currentMinutes = startH * 60 + startM;

  while (currentMinutes + slotDuration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += slotDuration;
  }
  return slots;
};

// GET /api/doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: { workingHours: true },
    });

    const formatted = doctors.map(d => ({
      ...d,
      leaveDays: JSON.parse(d.leaveDays || '[]'),
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: { workingHours: true },
    });

    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    return res.json({
      ...doc,
      leaveDays: JSON.parse(doc.leaveDays || '[]'),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors
router.post('/', async (req, res) => {
  const { email, name, specialization, slotDuration } = req.body;
  if (!email || !name || !specialization) {
    return res.status(400).json({ error: 'Email, Name, and Specialization are required.' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Create User + Profile
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: '$2a$10$hashedplaceholderpasswordhere', // seeded template password
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            name,
            email: email.toLowerCase(),
            specialization,
            slotDuration: slotDuration || 30,
            leaveDays: JSON.stringify([]),
            workingHours: {
              create: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
              ],
            },
          },
        },
      },
      include: { doctorProfile: true },
    });

    return res.status(201).json(newUser.doctorProfile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/doctors/:id
router.put('/:id', async (req, res) => {
  const { name, specialization, slotDuration, workingHours, email } = req.body;

  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    // Update DoctorProfile table
    await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: {
        name,
        specialization,
        slotDuration,
        email,
      },
    });

    // Update User table
    await prisma.user.update({
      where: { id: doc.userId },
      data: { name, email },
    });

    // Update WorkingHours
    if (workingHours && Array.isArray(workingHours)) {
      // Clear old hours
      await prisma.workingHour.deleteMany({
        where: { doctorId: req.params.id },
      });

      // Insert new hours
      await prisma.workingHour.createMany({
        data: workingHours.map((wh: any) => ({
          doctorId: req.params.id,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
        })),
      });
    }

    return res.json({ message: 'Doctor profile updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id/availability
router.get('/:id/availability', async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD).' });
  }

  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: { workingHours: true },
    });

    if (!doc) return res.status(404).json({ error: 'Doctor not found.' });

    // 1. Check if doctor is on leave
    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    if (leaves.includes(date)) {
      return res.json([]);
    }

    // 2. Get schedule for day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, etc.
    const schedule = doc.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!schedule) {
      return res.json([]); // Not working this day
    }

    // 3. Generate all possible timeslots
    const allSlots = generateTimeSlots(schedule.startTime, schedule.endTime, doc.slotDuration);

    // 4. Query active appointments (CONFIRMED or HELD and not expired)
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        date: date,
        OR: [
          { status: 'CONFIRMED' },
          {
            status: 'HELD',
            heldUntil: { gte: new Date() },
          },
        ],
      },
    });

    const bookedTimes = activeAppointments.map(a => a.startTime);

    // 5. Filter out booked timeslots
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    return res.json(availableSlots);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors/:id/leave
router.post('/:id/leave', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required.' });

  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found.' });

    // Update doctor leaves list
    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    if (!leaves.includes(date)) {
      leaves.push(date);
    }
    await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: { leaveDays: JSON.stringify(leaves) },
    });

    // Create Leave Record
    await prisma.leaveRecord.create({
      data: {
        doctorId: req.params.id,
        startDate: date,
        endDate: date,
        status: 'ACTIVE',
      },
    });

    // Cancel overlapping bookings
    const overlapping = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        date: date,
        status: { in: ['CONFIRMED', 'HELD'] },
      },
      include: { patient: true },
    });

    for (const apt of overlapping) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'CANCELLED_BY_DOCTOR_LEAVE' },
      });

      // Dispatch notifications to patient & doctor
      if (apt.patient) {
        await prisma.notification.create({
          data: {
            recipientEmail: apt.patient.email,
            type: 'LEAVE_CANCELLED',
            message: `Hi ${apt.patient.name}, your appointment with ${doc.name} on ${date} at ${apt.startTime} has been cancelled due to doctor unavailability.`,
          },
        });
      }

      await prisma.notification.create({
        data: {
          recipientEmail: doc.email,
          type: 'LEAVE_CANCELLED',
          message: `Appointment for ${apt.patient?.name || 'Patient'} on ${date} at ${apt.startTime} has been cancelled due to your leave.`,
        },
      });
    }

    return res.json({ affectedAppointmentsCount: overlapping.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors/:id/leave-range
router.post('/:id/leave-range', async (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required.' });
  }

  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found.' });

    // Generate date array
    const start = new Date(startDate);
    const end = new Date(endDate);
    const leaveDates: string[] = [];
    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      leaveDates.push(dateStr);
      if (!leaves.includes(dateStr)) {
        leaves.push(dateStr);
      }
    }

    // Update doctor leaves list
    await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: { leaveDays: JSON.stringify(leaves) },
    });

    // Create Leave Record
    await prisma.leaveRecord.create({
      data: {
        doctorId: req.params.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });

    // Cancel overlapping bookings
    const overlapping = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        date: { in: leaveDates },
        status: { in: ['CONFIRMED', 'HELD'] },
      },
      include: { patient: true },
    });

    for (const apt of overlapping) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'CANCELLED_BY_DOCTOR_LEAVE' },
      });

      if (apt.patient) {
        await prisma.notification.create({
          data: {
            recipientEmail: apt.patient.email,
            type: 'LEAVE_CANCELLED',
            message: `Hi ${apt.patient.name}, your appointment with ${doc.name} on ${apt.date} at ${apt.startTime} has been cancelled due to doctor unavailability.`,
          },
        });
      }

      await prisma.notification.create({
        data: {
          recipientEmail: doc.email,
          type: 'LEAVE_CANCELLED',
          message: `Appointment for ${apt.patient?.name || 'Patient'} on ${apt.date} at ${apt.startTime} has been cancelled due to your leave.`,
        },
      });
    }

    return res.json({ affectedAppointmentsCount: overlapping.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors/:id/cancel-leave
router.post('/:id/cancel-leave', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required.' });

  try {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found.' });

    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    const updatedLeaves = leaves.filter(l => l !== date);

    await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: { leaveDays: JSON.stringify(updatedLeaves) },
    });

    // Update active records covering this date
    await prisma.leaveRecord.updateMany({
      where: {
        doctorId: req.params.id,
        startDate: { lte: date },
        endDate: { gte: date },
        status: 'ACTIVE',
      },
      data: { status: 'RESUMED_EARLY' },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id/leaves
router.get('/:id/leaves', async (req, res) => {
  try {
    const leaves = await prisma.leaveRecord.findMany({
      where: { doctorId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leaves);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
