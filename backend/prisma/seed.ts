import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
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

  // 1. Create Users
  const userAdmin = await prisma.user.create({
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

  const userPatient = await prisma.user.create({
    data: {
      id: 'user-patient',
      email: 'patient@medsync.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  // 2. Create Profiles
  const doc1 = await prisma.doctorProfile.create({
    data: {
      id: 'doc-1',
      userId: userDoc1.id,
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      email: 'sarah.jenkins@medsync.com',
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
          { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
        ],
      },
    },
  });

  const pat1 = await prisma.patientProfile.create({
    data: {
      id: 'pat-1',
      userId: userPatient.id,
      name: 'John Doe',
      email: 'patient@medsync.com',
    },
  });

  // Helper date generators matching mock data
  const getPastDateStr = (daysAgo: number) => {
    return new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];
  };
  const getFutureDateStr = (daysAhead: number) => {
    return new Date(Date.now() + daysAhead * 24 * 3600 * 1000).toISOString().split('T')[0];
  };

  // 3. Create Appointments
  await prisma.appointment.create({
    data: {
      id: 'apt-mock-1',
      doctorId: doc1.id,
      patientId: pat1.id,
      date: getPastDateStr(7),
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
      doctorId: doc1.id,
      patientId: pat1.id,
      date: getPastDateStr(3),
      startTime: '11:00',
      endTime: '11:30',
      status: 'COMPLETED',
      symptoms: {
        create: {
          symptoms: 'Check-up on the chest tightness and EKG results.',
          urgency: 'Low',
          chiefComplaint: 'Check-up on chest tightness',
          suggestedQuestions: JSON.stringify([]),
        },
      },
      consultation: {
        create: {
          clinicalNotes: 'Patient reports feeling much better. Exercising without tightness.',
        },
      },
    },
  });

  await prisma.appointment.create({
    data: {
      id: 'apt-mock-3',
      doctorId: doc2.id,
      patientId: pat1.id,
      date: getPastDateStr(1),
      startTime: '09:30',
      endTime: '10:00',
      status: 'COMPLETED',
      symptoms: {
        create: {
          symptoms: 'Seasonal allergies and sore throat.',
          urgency: 'Low',
          chiefComplaint: 'Seasonal allergies',
          suggestedQuestions: JSON.stringify([]),
        },
      },
      consultation: {
        create: {
          clinicalNotes: 'Classic seasonal rhinitis. Prescribed antihistamines.',
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
      startTime: '14:00',
      endTime: '14:30',
      status: 'CONFIRMED',
      symptoms: {
        create: {
          symptoms: 'Routine follow-up regarding medication adjustments.',
          urgency: 'Low',
          chiefComplaint: 'Follow-up appointment',
          suggestedQuestions: JSON.stringify([]),
        },
      },
    },
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
