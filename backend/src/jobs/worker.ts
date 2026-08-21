import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import {
  sendBookingConfirmation,
  sendCancellation,
  sendLeaveCancellation,
  sendRescheduleNotification,
  sendAppointmentReminder,
  sendMedicationReminder,
} from '../integrations/email/nodemailer';

const prisma = new PrismaClient();
const REDIS_URL = process.env.REDIS_URL || '';

/**
 * Main Job Execution Router (shared between BullMQ and In-Memory Simulator)
 */
export const processJob = async (queueName: string, jobName: string, data: any) => {
  console.log(`[WORKER] Processing job: ${jobName} on queue: ${queueName}`);

  try {
    switch (queueName) {
      case 'email-retry':
        await handleEmailRetryJob(jobName, data);
        break;
      case 'medication-reminder':
        await handleMedicationReminderJob(jobName, data);
        break;
      case 'appointment-reminder':
        await handleAppointmentReminderJob(jobName, data);
        break;
      default:
        console.warn(`[WORKER] Unknown queue name: ${queueName}`);
    }
  } catch (error) {
    console.error(`[WORKER] Error processing job ${jobName}:`, error);
    throw error; // Re-throw to trigger BullMQ's automatic retry
  }
};

/**
 * Handle Email Send / Retry
 */
const handleEmailRetryJob = async (jobName: string, data: any) => {
  const { notificationId, type, recipientEmail, patientName, doctorName, date, time, oldDate, newDate, newTime } = data;
  let success = false;

  console.log(`[EMAIL WORKER] Sending email type: ${type} to ${recipientEmail}`);

  switch (type) {
    case 'BOOKING_CONFIRMED':
      success = await sendBookingConfirmation(recipientEmail, patientName, doctorName, date, time);
      break;
    case 'BOOKING_CANCELLED':
      success = await sendCancellation(recipientEmail, patientName, doctorName, date, time);
      break;
    case 'LEAVE_CANCELLED':
      success = await sendLeaveCancellation(recipientEmail, patientName, doctorName, date, time);
      break;
    case 'RESCHEDULED':
      success = await sendRescheduleNotification(recipientEmail, patientName, doctorName, oldDate, newDate, newTime);
      break;
    default:
      console.warn(`Unknown email type: ${type}`);
  }

  // Update notification record in the database
  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailStatus: success ? 'SENT' : 'FAILED',
      },
    });
  }

  if (!success) {
    throw new Error('Nodemailer delivery failed.');
  }
};

/**
 * Handle Medication reminder alerts
 */
const handleMedicationReminderJob = async (jobName: string, data: any) => {
  const { recipientEmail, patientName, medicationName, dosage, instructions } = data;
  const success = await sendMedicationReminder(recipientEmail, patientName, medicationName, dosage, instructions);
  if (!success) throw new Error('Medication reminder delivery failed.');
};

/**
 * Handle Appointment reminders
 */
const handleAppointmentReminderJob = async (jobName: string, data: any) => {
  const { recipientEmail, patientName, doctorName, date, time } = data;
  const success = await sendAppointmentReminder(recipientEmail, patientName, doctorName, date, time);
  if (!success) throw new Error('Appointment reminder delivery failed.');
};

// Start BullMQ workers if Redis is available
if (REDIS_URL) {
  try {
    const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

    const setupWorker = (queueName: string) => {
      const w = new Worker(queueName, async (job) => {
        await processJob(queueName, job.name, job.data);
      }, { connection });

      w.on('failed', (job, err) => {
        console.error(`[BULLMQ WORKER] Job failed in queue ${queueName}:`, err.message);
      });
    };

    setupWorker('email-retry');
    setupWorker('medication-reminder');
    setupWorker('appointment-reminder');

    console.log('BullMQ background workers initialized successfully.');
  } catch (error: any) {
    console.warn('Failed to start BullMQ workers. Running in in-memory mode only.', error.message);
  }
}
