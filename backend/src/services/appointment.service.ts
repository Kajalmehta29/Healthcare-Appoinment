import { PrismaClient } from '@prisma/client';
import { analyzeSymptoms } from '../integrations/ai/gemini';
import { dispatchJob } from '../jobs/queues';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../integrations/google-calendar/calendar';

const prisma = new PrismaClient();

export class AppointmentService {
  /**
   * Holds an appointment slot atomically
   */
  static async holdSlot(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    patientId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { workingHours: true },
      });
      if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

      const leaves: string[] = JSON.parse(doctor.leaveDays || '[]');
      if (leaves.includes(date)) {
        throw new Error('DOCTOR_ON_LEAVE');
      }

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const schedule = doctor.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
      if (!schedule) {
        throw new Error('NOT_WORKING_THIS_DAY');
      }

      if (startTime < schedule.startTime || endTime > schedule.endTime) {
        throw new Error('OUTSIDE_WORKING_HOURS');
      }

      const conflict = await tx.appointment.findFirst({
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

      if (conflict) {
        throw new Error('SLOT_NOT_AVAILABLE');
      }

      // 5. Create temporary HELD lock (expires in 5 minutes)
      const heldUntil = new Date(Date.now() + 5 * 60 * 1000);

      return await tx.appointment.create({
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
    });
  }

  /**
   * Confirms a held slot, triggers Gemini pre-visit, email, and Google Calendar integrations
   */
  static async confirmAppointment(appointmentId: string, symptomsText: string) {
    const result = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, patient: true },
      });

      if (!apt) throw new Error('HOLD_NOT_FOUND');
      if (apt.status !== 'HELD') throw new Error('APPOINTMENT_NOT_HELD');
      if (apt.heldUntil && new Date(apt.heldUntil).getTime() < Date.now()) {
        throw new Error('HOLD_EXPIRED');
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CONFIRMED',
          heldUntil: null,
        },
        include: { doctor: true, patient: true },
      });

      return updated;
    });

    const submission = await prisma.symptomSubmission.create({
      data: {
        appointmentId,
        symptoms: symptomsText,
        urgency: 'PENDING',
        chiefComplaint: 'Analyzing...',
        suggestedQuestions: JSON.stringify([]),
        aiStatus: 'PENDING',
      },
    });

    // Run AI analysis (Gemini failure does not break the booking process)
    try {
      const aiResult = await analyzeSymptoms(symptomsText);
      await prisma.symptomSubmission.update({
        where: { id: submission.id },
        data: {
          urgency: aiResult.urgency,
          chiefComplaint: aiResult.chiefComplaint,
          suggestedQuestions: JSON.stringify(aiResult.suggestedQuestions),
          aiStatus: 'SUCCESS',
        },
      });
    } catch (err) {
      console.error('Gemini Pre-visit analysis failed during confirmation:', err);
      const isUrgent = symptomsText.toLowerCase().includes('chest pain') || symptomsText.toLowerCase().includes('breathing');
      const urgency = isUrgent ? 'High' : (symptomsText.length > 50 ? 'Medium' : 'Low');
      await prisma.symptomSubmission.update({
        where: { id: submission.id },
        data: {
          urgency,
          chiefComplaint: symptomsText.substring(0, 40) + '...',
          suggestedQuestions: JSON.stringify([
            'How long have you experienced these specific symptoms?',
            'Does anything make the symptoms feel better or worse?',
            'Have you taken any over-the-counter medications for this?',
          ]),
          aiStatus: 'FAILED', // Flagged for optional future retries
        },
      });
    }

    if (result.patient) {
      const notifPatient = await prisma.notification.create({
        data: {
          recipientEmail: result.patient.email,
          type: 'BOOKING_CONFIRMED',
          message: `Hi ${result.patient.name}, your appointment with ${result.doctor.name} is confirmed for ${result.date} at ${result.startTime}.`,
          emailStatus: 'PENDING',
        },
      });

      await dispatchJob('email-retry', 'send-confirm-email', {
        notificationId: notifPatient.id,
        type: 'BOOKING_CONFIRMED',
        recipientEmail: result.patient.email,
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        date: result.date,
        time: result.startTime,
      });
    }

    const notifDoctor = await prisma.notification.create({
      data: {
        recipientEmail: result.doctor.email,
        type: 'BOOKING_CONFIRMED',
        message: `Doctor, you have a new appointment with patient ${result.patient?.name || 'Patient'} on ${result.date} at ${result.startTime}.`,
        emailStatus: 'PENDING',
      },
    });

    await dispatchJob('email-retry', 'send-doctor-email', {
      notificationId: notifDoctor.id,
      type: 'BOOKING_CONFIRMED',
      recipientEmail: result.doctor.email,
      patientName: result.patient?.name || 'Patient',
      doctorName: result.doctor.name,
      date: result.date,
      time: result.startTime,
    });

    if (result.patient && result.doctor) {
      const startIso = new Date(`${result.date}T${result.startTime}:00`).toISOString();
      const endIso = new Date(`${result.date}T${result.endTime}:00`).toISOString();

      await createCalendarEvent(appointmentId, result.doctor.userId, {
        summary: `Medsync Appointment - ${result.patient.name} & ${result.doctor.name}`,
        description: `Healthcare consult slot between Patient ${result.patient.name} and Doctor ${result.doctor.name}.`,
        startIso,
        endIso,
        attendees: [result.patient.email, result.doctor.email],
      });
    }

    const aptTime = new Date(`${result.date}T${result.startTime}:00`).getTime();
    const reminderDelay = aptTime - Date.now() - 24 * 3600 * 1000;
    if (reminderDelay > 0 && result.patient) {
      await dispatchJob(
        'appointment-reminder',
        'send-reminder',
        {
          recipientEmail: result.patient.email,
          patientName: result.patient.name,
          doctorName: result.doctor.name,
          date: result.date,
          time: result.startTime,
        },
        { delay: reminderDelay }
      );
    }

    return result;
  }

  /**
   * Reschedules an appointment atomically
   */
  static async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) {
    const original = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true },
    });
    if (!original) throw new Error('APPOINTMENT_NOT_FOUND');
    const oldDate = original.date;

    const result = await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.findUnique({
        where: { id: original.doctorId },
        include: { workingHours: true },
      });
      if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

      const leaves: string[] = JSON.parse(doctor.leaveDays || '[]');
      if (leaves.includes(newDate)) {
        throw new Error('DOCTOR_ON_LEAVE');
      }

      const dateObj = new Date(newDate);
      const dayOfWeek = dateObj.getDay();
      const schedule = doctor.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
      if (!schedule) throw new Error('NOT_WORKING_THIS_DAY');

      if (newStartTime < schedule.startTime || newEndTime > schedule.endTime) {
        throw new Error('OUTSIDE_WORKING_HOURS');
      }

      const conflict = await tx.appointment.findFirst({
        where: {
          id: { not: appointmentId },
          doctorId: original.doctorId,
          date: newDate,
          startTime: newStartTime,
          OR: [
            { status: 'CONFIRMED' },
            {
              status: 'HELD',
              heldUntil: { gte: new Date() },
            },
          ],
        },
      });

      if (conflict) throw new Error('SLOT_NOT_AVAILABLE');

      return await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'CONFIRMED',
        },
        include: { doctor: true, patient: true },
      });
    });

    if (result.doctor) {
      const startIso = new Date(`${newDate}T${newStartTime}:00`).toISOString();
      const endIso = new Date(`${newDate}T${newEndTime}:00`).toISOString();
      await updateCalendarEvent(appointmentId, result.doctor.userId, startIso, endIso);
    }

    if (result.patient) {
      const notif = await prisma.notification.create({
        data: {
          recipientEmail: result.patient.email,
          type: 'RESCHEDULED',
          message: `Hi ${result.patient.name}, your appointment with ${result.doctor.name} has been rescheduled to ${newDate} at ${newStartTime}.`,
          emailStatus: 'PENDING',
        },
      });

      await dispatchJob('email-retry', 'send-reschedule-email', {
        notificationId: notif.id,
        type: 'RESCHEDULED',
        recipientEmail: result.patient.email,
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        oldDate,
        newDate,
        newTime: newStartTime,
      });
    }

    return result;
  }

  /**
   * Cancels appointment
   */
  static async cancelAppointment(appointmentId: string) {
    const apt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true },
    });
    if (!apt) throw new Error('APPOINTMENT_NOT_FOUND');

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    if (apt.doctor) {
      await deleteCalendarEvent(appointmentId, apt.doctor.userId);
    }

    if (apt.patient) {
      const notifPatient = await prisma.notification.create({
        data: {
          recipientEmail: apt.patient.email,
          type: 'BOOKING_CANCELLED',
          message: `Your appointment with ${apt.doctor.name} on ${apt.date} at ${apt.startTime} has been cancelled.`,
          emailStatus: 'PENDING',
        },
      });

      await dispatchJob('email-retry', 'send-cancel-patient', {
        notificationId: notifPatient.id,
        type: 'BOOKING_CANCELLED',
        recipientEmail: apt.patient.email,
        patientName: apt.patient.name,
        doctorName: apt.doctor.name,
        date: apt.date,
        time: apt.startTime,
      });
    }

    const notifDoctor = await prisma.notification.create({
      data: {
        recipientEmail: apt.doctor.email,
        type: 'BOOKING_CANCELLED',
        message: `Appointment for ${apt.patient?.name || 'Patient'} on ${apt.date} at ${apt.startTime} has been cancelled.`,
        emailStatus: 'PENDING',
      },
    });

    await dispatchJob('email-retry', 'send-cancel-doctor', {
      notificationId: notifDoctor.id,
      type: 'BOOKING_CANCELLED',
      recipientEmail: apt.doctor.email,
      patientName: apt.patient?.name || 'Patient',
      doctorName: apt.doctor.name,
      date: apt.date,
      time: apt.startTime,
    });
  }
}
