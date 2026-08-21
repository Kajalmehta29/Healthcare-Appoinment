import { PrismaClient } from '@prisma/client';
import { dispatchJob } from '../jobs/queues';
import { deleteCalendarEvent } from '../integrations/google-calendar/calendar';

const prisma = new PrismaClient();

const generateSlots = (startTime: string, endTime: string, slotDuration: number): string[] => {
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

export class DoctorService {
  static async listDoctors() {
    const doctors = await prisma.doctorProfile.findMany({
      include: { workingHours: true },
    });
    return doctors.map(d => ({
      ...d,
      leaveDays: JSON.parse(d.leaveDays || '[]'),
    }));
  }

  static async getDoctor(id: string) {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { workingHours: true },
    });
    if (!doc) throw new Error('DOCTOR_NOT_FOUND');
    return {
      ...doc,
      leaveDays: JSON.parse(doc.leaveDays || '[]'),
    };
  }

  static async createDoctor(email: string, name: string, specialization: string, slotDuration: number) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) throw new Error('EMAIL_ALREADY_IN_USE');

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: '$2a$10$hashedplaceholderpasswordhere', // temp seeded pattern
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

    return newUser.doctorProfile;
  }

  static async updateDoctor(
    id: string,
    data: { name: string; specialization: string; slotDuration: number; email: string; workingHours?: any[] }
  ) {
    const doc = await prisma.doctorProfile.findUnique({ where: { id } });
    if (!doc) throw new Error('DOCTOR_NOT_FOUND');

    await prisma.doctorProfile.update({
      where: { id },
      data: {
        name: data.name,
        specialization: data.specialization,
        slotDuration: data.slotDuration,
        email: data.email,
      },
    });

    await prisma.user.update({
      where: { id: doc.userId },
      data: { name: data.name, email: data.email },
    });

    if (data.workingHours && Array.isArray(data.workingHours)) {
      await prisma.workingHour.deleteMany({ where: { doctorId: id } });
      await prisma.workingHour.createMany({
        data: data.workingHours.map(wh => ({
          doctorId: id,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
        })),
      });
    }
  }

  static async getAvailability(id: string, date: string) {
    const doc = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { workingHours: true },
    });

    if (!doc) throw new Error('DOCTOR_NOT_FOUND');

    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    if (leaves.includes(date)) return [];

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const schedule = doc.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!schedule) return [];

    const allSlots = generateSlots(schedule.startTime, schedule.endTime, doc.slotDuration);

    const activeAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
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
    return allSlots.filter(slot => !bookedTimes.includes(slot));
  }

  static async setLeave(id: string, date: string) {
    const doc = await prisma.doctorProfile.findUnique({ where: { id } });
    if (!doc) throw new Error('DOCTOR_NOT_FOUND');

    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    if (!leaves.includes(date)) {
      leaves.push(date);
    }

    await prisma.doctorProfile.update({
      where: { id },
      data: { leaveDays: JSON.stringify(leaves) },
    });

    await prisma.leaveRecord.create({
      data: {
        doctorId: id,
        startDate: date,
        endDate: date,
        status: 'ACTIVE',
      },
    });

    // Cancel overlapping bookings
    const overlapping = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        date,
        status: { in: ['CONFIRMED', 'HELD'] },
      },
      include: { patient: true },
    });

    for (const apt of overlapping) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'CANCELLED_BY_DOCTOR_LEAVE' },
      });

      // Clear Google Calendar Event
      await deleteCalendarEvent(apt.id, doc.userId);

      // Create Patient Notification
      if (apt.patient) {
        const notif = await prisma.notification.create({
          data: {
            recipientEmail: apt.patient.email,
            type: 'LEAVE_CANCELLED',
            message: `Hi ${apt.patient.name}, your appointment with ${doc.name} on ${date} at ${apt.startTime} has been cancelled due to doctor unavailability.`,
            emailStatus: 'PENDING',
          },
        });

        await dispatchJob('email-retry', 'send-leave-cancel-email', {
          notificationId: notif.id,
          type: 'LEAVE_CANCELLED',
          recipientEmail: apt.patient.email,
          patientName: apt.patient.name,
          doctorName: doc.name,
          date,
          time: apt.startTime,
        });
      }
    }

    return overlapping.length;
  }

  static async setLeaveRange(id: string, startDate: string, endDate: string) {
    const doc = await prisma.doctorProfile.findUnique({ where: { id } });
    if (!doc) throw new Error('DOCTOR_NOT_FOUND');

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

    await prisma.doctorProfile.update({
      where: { id },
      data: { leaveDays: JSON.stringify(leaves) },
    });

    await prisma.leaveRecord.create({
      data: {
        doctorId: id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });

    // Cancel overlapping bookings
    const overlapping = await prisma.appointment.findMany({
      where: {
        doctorId: id,
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

      // Clear Google Calendar Event
      await deleteCalendarEvent(apt.id, doc.userId);

      // Create Patient Notification
      if (apt.patient) {
        const notif = await prisma.notification.create({
          data: {
            recipientEmail: apt.patient.email,
            type: 'LEAVE_CANCELLED',
            message: `Hi ${apt.patient.name}, your appointment with ${doc.name} on ${apt.date} at ${apt.startTime} has been cancelled due to doctor unavailability.`,
            emailStatus: 'PENDING',
          },
        });

        await dispatchJob('email-retry', 'send-leave-cancel-email', {
          notificationId: notif.id,
          type: 'LEAVE_CANCELLED',
          recipientEmail: apt.patient.email,
          patientName: apt.patient.name,
          doctorName: doc.name,
          date: apt.date,
          time: apt.startTime,
        });
      }
    }

    return overlapping.length;
  }

  static async cancelLeaveEarly(id: string, date: string) {
    const doc = await prisma.doctorProfile.findUnique({ where: { id } });
    if (!doc) throw new Error('DOCTOR_NOT_FOUND');

    const leaves: string[] = JSON.parse(doc.leaveDays || '[]');
    const updated = leaves.filter(l => l !== date);

    await prisma.doctorProfile.update({
      where: { id },
      data: { leaveDays: JSON.stringify(updated) },
    });

    await prisma.leaveRecord.updateMany({
      where: {
        doctorId: id,
        startDate: { lte: date },
        endDate: { gte: date },
        status: 'ACTIVE',
      },
      data: { status: 'RESUMED_EARLY' },
    });
  }

  static async getLeaves(doctorId: string) {
    return await prisma.leaveRecord.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
