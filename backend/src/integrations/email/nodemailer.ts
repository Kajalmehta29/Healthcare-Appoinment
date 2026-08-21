import * as nodemailer from 'nodemailer';

// Configure transporter
const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback: Ethereal test account for instant local testing
  console.log('SMTP credentials not fully configured in env. Creating a test Ethereal SMTP account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.error('Failed to create Ethereal SMTP account. Emails will print to console only.');
    return null;
  }
};

/**
 * Core send helper
 */
export const sendMail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[EMAIL SEND SIMULATION] To: ${to} | Subject: ${subject}\nBody: ${html.replace(/<[^>]*>/g, '')}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Medsync Healthcare" <no-reply@medsync.com>',
      to,
      subject,
      html,
    });

    console.log(`Email successfully sent! Message ID: ${info.messageId}`);
    // If using Ethereal, log preview link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ View Ethereal Email Preview: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false; // Return false so calling logic can flag the job for retry
  }
};

/**
 * Booking confirmation
 */
export const sendBookingConfirmation = async (to: string, patientName: string, doctorName: string, date: string, time: string) => {
  const subject = 'Appointment Confirmation - Medsync';
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>Your healthcare appointment with <strong>${doctorName}</strong> has been successfully booked.</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Time:</strong> ${time}</p>
    <br/>
    <p>If you need to make changes, please visit your Medsync dashboard.</p>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};

/**
 * Appointment cancellation
 */
export const sendCancellation = async (to: string, patientName: string, doctorName: string, date: string, time: string) => {
  const subject = 'Appointment Cancelled - Medsync';
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>We are writing to let you know that your appointment with <strong>${doctorName}</strong> on ${date} at ${time} has been cancelled.</p>
    <br/>
    <p>You can visit your Medsync dashboard to select another time slot.</p>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};

/**
 * Doctor Leave affected notification
 */
export const sendLeaveCancellation = async (to: string, patientName: string, doctorName: string, date: string, time: string) => {
  const subject = 'Urgent: Appointment Cancelled due to Doctor Leave';
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>We regret to inform you that your appointment with <strong>${doctorName}</strong> on ${date} at ${time} has been cancelled because the doctor is on leave during that period.</p>
    <br/>
    <p>Please log in to your Medsync account to schedule another slot at your earliest convenience.</p>
    <p>We apologize for the inconvenience.</p>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};

/**
 * Reschedule notification
 */
export const sendRescheduleNotification = async (to: string, patientName: string, doctorName: string, oldDate: string, newDate: string, newTime: string) => {
  const subject = 'Appointment Rescheduled - Medsync';
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>Your appointment with <strong>${doctorName}</strong> originally scheduled for ${oldDate} has been rescheduled.</p>
    <p><strong>New Date:</strong> ${newDate}</p>
    <p><strong>New Time:</strong> ${newTime}</p>
    <br/>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};

/**
 * Appointment Reminder
 */
export const sendAppointmentReminder = async (to: string, patientName: string, doctorName: string, date: string, time: string) => {
  const subject = 'Reminder: Upcoming Appointment - Medsync';
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>This is a reminder that you have an upcoming appointment scheduled with <strong>${doctorName}</strong>.</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Time:</strong> ${time}</p>
    <p>Please log in to join your consult.</p>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};

/**
 * Medication Reminder
 */
export const sendMedicationReminder = async (to: string, patientName: string, medicationName: string, dosage: string, instructions: string) => {
  const subject = `Medication Reminder: ${medicationName}`;
  const html = `
    <h2>Hello ${patientName},</h2>
    <p>This is a friendly reminder to take your prescribed medication: <strong>${medicationName}</strong>.</p>
    <p><strong>Dosage:</strong> ${dosage}</p>
    <p><strong>Instructions:</strong> ${instructions}</p>
    <br/>
    <p>Please take care of your health.</p>
    <p>Warm regards,<br/>Medsync Team</p>
  `;
  return sendMail(to, subject, html);
};
