import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with expanded clinic datasets...');
  await prisma.notification.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.symptomSubmission.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.leaveRecord.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);
  await prisma.user.create({
    data: {
      id: 'user-admin',
      email: 'admin@medsync.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  const userDoc1 = await prisma.user.create({
    data: {
      id: 'user-doc-1',
      email: 'doctor@medsync.com',
      name: 'Dr. Sarah Jenkins',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  });

  const userDoc2 = await prisma.user.create({
    data: {
      id: 'user-doc-2',
      email: 'alex.rivera@medsync.com',
      name: 'Dr. Alex Rivera',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  });

  const userDoc3 = await prisma.user.create({
    data: {
      id: 'user-doc-3',
      email: 'emily.chen@medsync.com',
      name: 'Dr. Emily Chen',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  });

  const userDoc4 = await prisma.user.create({
    data: {
      id: 'user-doc-4',
      email: 'michael.chang@medsync.com',
      name: 'Dr. Michael Chang',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  });

  const userDoc5 = await prisma.user.create({
    data: {
      id: 'user-doc-5',
      email: 'lisa.patel@medsync.com',
      name: 'Dr. Lisa Patel',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  });
  const userPatient1 = await prisma.user.create({
    data: {
      id: 'user-patient-1',
      email: 'patient@medsync.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const userPatient2 = await prisma.user.create({
    data: {
      id: 'user-patient-2',
      email: 'jane.smith@medsync.com',
      name: 'Jane Smith',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const userPatient3 = await prisma.user.create({
    data: {
      id: 'user-patient-3',
      email: 'bob.johnson@medsync.com',
      name: 'Bob Johnson',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const userPatient4 = await prisma.user.create({
    data: {
      id: 'user-patient-4',
      email: 'alice.williams@medsync.com',
      name: 'Alice Williams',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });
  const doc1 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-1',
      userId: userDoc1.id,
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      email: 'doctor@medsync.com',
      slotDuration: 30,
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
  });

  const doc2 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-2',
      userId: userDoc2.id,
      name: 'Dr. Alex Rivera',
      specialization: 'Pediatrics',
      email: 'alex.rivera@medsync.com',
      slotDuration: 30,
      leaveDays: JSON.stringify([]),
      workingHours: {
        create: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
          { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
          { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
          { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
          { dayOfWeek: 5, startTime: '08:00', endTime: '12:00' },
        ],
      },
    },
  });

  const doc3 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-3',
      userId: userDoc3.id,
      name: 'Dr. Emily Chen',
      specialization: 'Dermatology',
      email: 'emily.chen@medsync.com',
      slotDuration: 15,
      leaveDays: JSON.stringify([]),
      workingHours: {
        create: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
        ],
      },
    },
  });

  const doc4 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-4',
      userId: userDoc4.id,
      name: 'Dr. Michael Chang',
      specialization: 'General Medicine',
      email: 'michael.chang@medsync.com',
      slotDuration: 20,
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
  });

  const doc5 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-5',
      userId: userDoc5.id,
      name: 'Dr. Lisa Patel',
      specialization: 'Orthopedics',
      email: 'lisa.patel@medsync.com',
      slotDuration: 30,
      leaveDays: JSON.stringify([]),
      workingHours: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '16:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '16:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '16:00' },
        ],
      },
    },
  });
  const pat1 = await prisma.patientProfile.create({
    data: {
      id: 'pat-1',
      userId: userPatient1.id,
      name: 'John Doe',
      email: 'patient@medsync.com',
    },
  });

  const pat2 = await prisma.patientProfile.create({
    data: {
      id: 'pat-2',
      userId: userPatient2.id,
      name: 'Jane Smith',
      email: 'jane.smith@medsync.com',
    },
  });

  const pat3 = await prisma.patientProfile.create({
    data: {
      id: 'pat-3',
      userId: userPatient3.id,
      name: 'Bob Johnson',
      email: 'bob.johnson@medsync.com',
    },
  });

  const pat4 = await prisma.patientProfile.create({
    data: {
      id: 'pat-4',
      userId: userPatient4.id,
      name: 'Alice Williams',
      email: 'alice.williams@medsync.com',
    },
  });
  const getPastDateStr = (daysAgo: number) => {
    return new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];
  };
  const getFutureDateStr = (daysAhead: number) => {
    return new Date(Date.now() + daysAhead * 24 * 3600 * 1000).toISOString().split('T')[0];
  };
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-1',
      doctorId: doc1.id,
      patientId: pat1.id,
      date: getPastDateStr(10),
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      symptoms: {
        create: {
          symptoms: 'Mild chest tightness when running.',
          urgency: 'Medium',
          chiefComplaint: 'Mild chest tightness',
          suggestedQuestions: JSON.stringify([
            'How long have you experienced these specific symptoms?',
            'Does anything make the symptoms feel better or worse?',
            'Have you taken any over-the-counter medications for this?',
          ]),
        },
      },
      consultation: {
        create: {
          clinicalNotes: 'Discussed patient activity level. Tightness seems exertion-related. EKG performed - normal.',
        },
      },
      prescription: {
        create: {
          followUpInstructions: 'Return in 3 months for follow up EKG or immediately if pain persists.',
          medications: {
            create: [
              { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', duration: '30 days' },
            ],
          },
        },
      },
      aiSummary: {
        create: {
          summaryText: 'Patient visited regarding clinical concerns. The doctor recommended rest and a specific medication schedule: Aspirin.',
          medicationSchedule: '- Aspirin: Take 81mg Once daily for 30 days.',
          followUpSteps: 'Return in 3 months for follow up EKG or immediately if pain persists.',
          status: 'SUCCESS',
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-2',
      doctorId: doc4.id,
      patientId: pat2.id,
      date: getPastDateStr(5),
      startTime: '09:00',
      endTime: '09:20',
      status: 'COMPLETED',
      symptoms: {
        create: {
          symptoms: 'Severe throat irritation and dry cough.',
          urgency: 'Low',
          chiefComplaint: 'Severe throat irritation',
          suggestedQuestions: JSON.stringify([
            'Do you have any difficulty swallowing liquids or solids?',
            'Have you checked your temperature for fever?',
          ]),
        },
      },
      consultation: {
        create: {
          clinicalNotes: 'Throat shows mild inflammation. No sign of bacterial strep. Prescribed antibiotic course as a precaution.',
        },
      },
      prescription: {
        create: {
          followUpInstructions: 'Stay hydrated. Rest voice. Re-visit if irritation lasts over a week.',
          medications: {
            create: [
              { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times/day', duration: '7 days' },
            ],
          },
        },
      },
      aiSummary: {
        create: {
          summaryText: 'Diagnosed with mild pharyngitis. A precautionary course of antibiotics has been prescribed.',
          medicationSchedule: '- Amoxicillin: 500mg 3 times a day for 7 days.',
          followUpSteps: 'Drink warm fluids, rest, and follow up if symptoms persist past 7 days.',
          status: 'SUCCESS',
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-3',
      doctorId: doc3.id,
      patientId: pat3.id,
      date: getPastDateStr(3),
      startTime: '14:00',
      endTime: '14:15',
      status: 'COMPLETED',
      symptoms: {
        create: {
          symptoms: 'Red itchy rash spreading on the left arm.',
          urgency: 'Medium',
          chiefComplaint: 'Red itchy rash on arm',
          suggestedQuestions: JSON.stringify([
            'Did you touch any poison ivy or wild plants recently?',
            'Have you started using a new laundry soap or body wash?',
          ]),
        },
      },
      consultation: {
        create: {
          clinicalNotes: 'Contact dermatitis. Prescribed hydrocortisone topical ointment.',
        },
      },
      prescription: {
        create: {
          followUpInstructions: 'Apply ointment twice daily. Avoid scratching to prevent secondary infection.',
          medications: {
            create: [
              { name: 'Hydrocortisone Ointment', dosage: '1% topical', frequency: 'Apply twice daily', duration: '5 days' },
            ],
          },
        },
      },
      aiSummary: {
        create: {
          summaryText: 'Diagnosed with contact dermatitis on the left arm. Apply topical treatment.',
          medicationSchedule: '- Hydrocortisone Cream: Apply to rash twice daily for 5 days.',
          followUpSteps: 'Avoid scratching. If the rash spreads or discharges, return to the clinic.',
          status: 'SUCCESS',
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-4',
      doctorId: doc1.id,
      patientId: pat1.id,
      date: getFutureDateStr(1),
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      symptoms: {
        create: {
          symptoms: 'Routine cardiology review and prescription refill.',
          urgency: 'Low',
          chiefComplaint: 'Routine check-up',
          suggestedQuestions: JSON.stringify([
            'Has your activity tolerance changed since the last visit?',
          ]),
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-5',
      doctorId: doc5.id,
      patientId: pat4.id,
      date: getFutureDateStr(2),
      startTime: '11:00',
      endTime: '11:30',
      status: 'CONFIRMED',
      symptoms: {
        create: {
          symptoms: 'Swollen left knee after walking down stairs. Pain level 7/10.',
          urgency: 'High',
          chiefComplaint: 'Swollen painful knee',
          suggestedQuestions: JSON.stringify([
            'Did you hear a pop or snapping sound when the injury occurred?',
            'Are you able to bear weight on the leg?',
          ]),
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-6',
      doctorId: doc2.id,
      patientId: pat3.id,
      date: getFutureDateStr(3),
      startTime: '09:30',
      endTime: '10:00',
      status: 'CONFIRMED',
      symptoms: {
        create: {
          symptoms: 'Routine checkup for child allergies.',
          urgency: 'Low',
          chiefComplaint: 'Allergy consultation',
          suggestedQuestions: JSON.stringify([]),
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-7',
      doctorId: doc4.id,
      patientId: pat2.id,
      date: getFutureDateStr(4),
      startTime: '15:00',
      endTime: '15:20',
      status: 'HELD',
      heldUntil: new Date(Date.now() + 4 * 60 * 1000),
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-8',
      doctorId: doc2.id,
      patientId: pat1.id,
      date: getPastDateStr(2),
      startTime: '08:30',
      endTime: '09:00',
      status: 'CANCELLED',
    },
  });
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-9',
      doctorId: doc1.id,
      patientId: pat4.id,
      date: getPastDateStr(1),
      startTime: '14:00',
      endTime: '14:30',
      status: 'CANCELLED_BY_DOCTOR_LEAVE',
    },
  });
  await prisma.leaveRecord.create({
    data: {
      id: 'leave-1',
      doctorId: doc1.id,
      startDate: getPastDateStr(2),
      endDate: getPastDateStr(1),
      status: 'COMPLETED',
    },
  });

  await prisma.leaveRecord.create({
    data: {
      id: 'leave-2',
      doctorId: doc2.id,
      startDate: getFutureDateStr(10),
      endDate: getFutureDateStr(12),
      status: 'ACTIVE',
    },
  });
  await prisma.doctorProfile.update({
    where: { id: doc2.id },
    data: {
      leaveDays: JSON.stringify([getFutureDateStr(10), getFutureDateStr(11), getFutureDateStr(12)]),
    },
  });
  await prisma.notification.create({
    data: {
      recipientEmail: pat1.email,
      type: 'BOOKING_CONFIRMED',
      message: `Hi John Doe, your appointment with Dr. Sarah Jenkins is confirmed for ${getFutureDateStr(1)} at 10:00.`,
      emailStatus: 'SENT',
    },
  });

  await prisma.notification.create({
    data: {
      recipientEmail: pat4.email,
      type: 'LEAVE_CANCELLED',
      message: `Dear Alice Williams, Dr. Sarah Jenkins is on leave on ${getPastDateStr(1)}. Your appointment has been cancelled.`,
      emailStatus: 'SENT',
    },
  });

  await prisma.notification.create({
    data: {
      recipientEmail: pat3.email,
      type: 'BOOKING_CONFIRMED',
      message: `Hi Bob Johnson, your appointment with Dr. Alex Rivera is confirmed for ${getFutureDateStr(3)} at 09:30.`,
      emailStatus: 'PENDING',
    },
  });

  console.log('Database successfully seeded with complete datasets!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
