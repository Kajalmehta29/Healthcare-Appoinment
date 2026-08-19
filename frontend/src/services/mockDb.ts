import { User, DoctorProfile, PatientProfile, Appointment, SymptomSubmission, Consultation, Prescription, Role, WorkingHour, Medication, LeaveRecord } from '../types';

// Seed data
const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-1',
    userId: 'user-doc-1',
    name: 'Dr. Sarah Jenkins',
    specialization: 'Cardiology',
    email: 'sarah.jenkins@medsync.com',
    slotDuration: 30,
    workingHours: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
    leaveDays: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    userId: 'user-doc-2',
    name: 'Dr. Alex Rivera',
    specialization: 'Pediatrics',
    email: 'alex.rivera@medsync.com',
    slotDuration: 30,
    workingHours: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00' }, // half day
    ],
    leaveDays: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doc-3',
    userId: 'user-doc-3',
    name: 'Dr. Emily Chen',
    specialization: 'Dermatology',
    email: 'emily.chen@medsync.com',
    slotDuration: 15,
    workingHours: [
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' }, // Saturday
    ],
    leaveDays: [],
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_USERS: User[] = [
  { id: 'user-admin', email: 'admin@medsync.com', role: 'ADMIN', name: 'System Administrator', createdAt: new Date().toISOString() },
  { id: 'user-doc-1', email: 'doctor@medsync.com', role: 'DOCTOR', name: 'Dr. Sarah Jenkins', createdAt: new Date().toISOString() },
  { id: 'user-doc-2', email: 'alex.rivera@medsync.com', role: 'DOCTOR', name: 'Dr. Alex Rivera', createdAt: new Date().toISOString() },
  { id: 'user-doc-3', email: 'emily.chen@medsync.com', role: 'DOCTOR', name: 'Dr. Emily Chen', createdAt: new Date().toISOString() },
  { id: 'user-patient', email: 'patient@medsync.com', role: 'PATIENT', name: 'John Doe', createdAt: new Date().toISOString() },
];

const DEFAULT_PATIENTS: PatientProfile[] = [
  { id: 'pat-1', userId: 'user-patient', name: 'John Doe', email: 'patient@medsync.com', createdAt: new Date().toISOString() }
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-mock-1',
    doctorId: 'doc-1',
    patientId: 'pat-1',
    date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0], // 7 days ago
    startTime: '10:00',
    endTime: '10:30',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-mock-2',
    doctorId: 'doc-1',
    patientId: 'pat-1',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0], // 3 days ago
    startTime: '11:00',
    endTime: '11:30',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-mock-3',
    doctorId: 'doc-2',
    patientId: 'pat-1',
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], // 1 day ago
    startTime: '09:30',
    endTime: '10:00',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-mock-4',
    doctorId: 'doc-1',
    patientId: 'pat-1',
    date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0], // tomorrow
    startTime: '14:00',
    endTime: '14:30',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SYMPTOMS: SymptomSubmission[] = [
  {
    id: 'symp-1',
    appointmentId: 'apt-mock-1',
    symptoms: 'Mild tightness in chest and shortness of breath when running.',
    urgency: 'High',
    chiefComplaint: 'Exertional dyspnea and chest discomfort',
    suggestedQuestions: [
      'Does the chest tightness radiate to your arm or neck?',
      'Have you noticed any swelling in your legs or ankles?',
      'How long does the shortness of breath last after you stop running?'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'symp-2',
    appointmentId: 'apt-mock-2',
    symptoms: 'Recurring heart palpitations and fatigue during office hours.',
    urgency: 'Medium',
    chiefComplaint: 'Heart palpitations and general fatigue',
    suggestedQuestions: [
      'Are the palpitations accompanied by dizziness or sweating?',
      'How much caffeine do you consume on average daily?',
      'Do you experience chest pain during palpitations?'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'symp-3',
    appointmentId: 'apt-mock-3',
    symptoms: 'Persistent dry cough and mild sore throat in the mornings.',
    urgency: 'Low',
    chiefComplaint: 'Dry cough and morning pharyngitis',
    suggestedQuestions: [
      'Have you had any fever, chills, or muscle aches?',
      'Is there any history of seasonal allergies or acid reflux?',
      'Does warm tea or throat lozenges improve the pain?'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'symp-4',
    appointmentId: 'apt-mock-4',
    symptoms: 'Follow-up cardiology consultation to review heart rate charts.',
    urgency: 'Low',
    chiefComplaint: 'Cardiology progress check',
    suggestedQuestions: [
      'Have you been taking your daily dosage of Metoprolol Succinate?',
      'Have your palpitations reduced since starting the medication?',
      'Do you feel any side effects like lightheadedness?'
    ],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CONSULTATIONS: Consultation[] = [
  {
    id: 'cons-1',
    appointmentId: 'apt-mock-1',
    clinicalNotes: 'Patient describes mild exertional dyspnea. EKG shows normal sinus rhythm with occasional PACs. Recommended patient logs heart rates and starts mild medication.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cons-2',
    appointmentId: 'apt-mock-2',
    clinicalNotes: 'Palpitations appear linked to stress and high caffeine intake. PAC frequency has decreased. Advised dietary modifications and stress management protocols.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cons-3',
    appointmentId: 'apt-mock-3',
    clinicalNotes: 'Pharyngitis diagnostics show minor swelling. Non-streptococcal. Prescribed hydration, cough syrup, and voice rest for three days.',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'pres-1',
    appointmentId: 'apt-mock-1',
    medications: [
      { id: 'med-1-1', prescriptionId: 'pres-1', name: 'Metoprolol Succinate', dosage: '25mg', frequency: 'Once Daily', duration: '30 Days' }
    ],
    followUpInstructions: 'Return for ECG check in 2 weeks.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pres-2',
    appointmentId: 'apt-mock-2',
    medications: [
      { id: 'med-2-1', prescriptionId: 'pres-2', name: 'Metoprolol Succinate', dosage: '25mg', frequency: 'Once Daily', duration: '30 Days' },
      { id: 'med-2-2', prescriptionId: 'pres-2', name: 'Coenzyme Q10', dosage: '100mg', frequency: 'Once Daily', duration: '60 Days' }
    ],
    followUpInstructions: 'Reduce coffee intake, log daily blood pressure.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pres-3',
    appointmentId: 'apt-mock-3',
    medications: [
      { id: 'med-3-1', prescriptionId: 'pres-3', name: 'Cough Suppressant Syrup', dosage: '10ml', frequency: 'Every 8 Hours', duration: '5 Days' }
    ],
    followUpInstructions: 'Hydrate frequently. If fever persists, return to clinic.',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_AI_SUMMARIES = [
  {
    id: 'ai-1',
    appointmentId: 'apt-mock-1',
    summaryText: 'You visited regarding mild tightness in your chest when running. The doctor reviewed your heart rhythm and found it normal. You are prescribed Metoprolol to keep your heart rate steady.',
    medicationSchedule: '- Metoprolol Succinate: Take 25mg once daily in the morning with food.',
    followUpSteps: 'Schedule a follow-up appointment in 2 weeks to repeat the ECG check.',
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai-2',
    appointmentId: 'apt-mock-2',
    summaryText: 'You reported palpitations during work. The doctor noted these are linked to caffeine and stress. Your heart rate drug is continued and Q10 vitamin is added.',
    medicationSchedule: '- Metoprolol Succinate: 25mg once daily.\n- Coenzyme Q10: 100mg once daily.',
    followUpSteps: 'Log blood pressure daily and reduce caffeine.',
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai-3',
    appointmentId: 'apt-mock-3',
    summaryText: 'You had a dry cough. The doctor diagnosed mild throat inflammation. You are prescribed standard cough syrup for relief.',
    medicationSchedule: '- Cough Syrup: 10ml every 8 hours for 5 days.',
    followUpSteps: 'Rest your voice, drink warm liquids, and monitor for fever.',
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  }
];

export class MockDb {
  static init() {
    if (!localStorage.getItem('medsync_users')) {
      localStorage.setItem('medsync_users', JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem('medsync_doctors')) {
      localStorage.setItem('medsync_doctors', JSON.stringify(DEFAULT_DOCTORS));
    }
    if (!localStorage.getItem('medsync_patients')) {
      localStorage.setItem('medsync_patients', JSON.stringify(DEFAULT_PATIENTS));
    }
    const appointmentsRaw = localStorage.getItem('medsync_appointments');
    if (!appointmentsRaw || JSON.parse(appointmentsRaw).length === 0) {
      localStorage.setItem('medsync_appointments', JSON.stringify(DEFAULT_APPOINTMENTS));
      localStorage.setItem('medsync_symptoms', JSON.stringify(DEFAULT_SYMPTOMS));
      localStorage.setItem('medsync_consultations', JSON.stringify(DEFAULT_CONSULTATIONS));
      localStorage.setItem('medsync_prescriptions', JSON.stringify(DEFAULT_PRESCRIPTIONS));
      localStorage.setItem('medsync_ai_summaries', JSON.stringify(DEFAULT_AI_SUMMARIES));
    }
    if (!localStorage.getItem('medsync_notifications')) {
      localStorage.setItem('medsync_notifications', JSON.stringify([]));
    }
    if (!localStorage.getItem('medsync_leave_history')) {
      localStorage.setItem('medsync_leave_history', JSON.stringify([]));
    }
  }

  // Getters
  static getLeaveHistory(): LeaveRecord[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_leave_history') || '[]');
  }

  static getUsers(): User[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_users') || '[]');
  }

  static getDoctors(): DoctorProfile[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_doctors') || '[]');
  }

  static getPatients(): PatientProfile[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_patients') || '[]');
  }

  static getAppointments(): Appointment[] {
    this.init();
    this.cleanupExpiredHolds();
    return JSON.parse(localStorage.getItem('medsync_appointments') || '[]');
  }

  static getSymptoms(): SymptomSubmission[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_symptoms') || '[]');
  }

  static getConsultations(): Consultation[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_consultations') || '[]');
  }

  static getPrescriptions(): Prescription[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_prescriptions') || '[]');
  }

  static getNotifications(): any[] {
    this.init();
    return JSON.parse(localStorage.getItem('medsync_notifications') || '[]');
  }

  // Clean expired holds
  private static cleanupExpiredHolds() {
    const raw = localStorage.getItem('medsync_appointments');
    if (!raw) return;
    const appointments: Appointment[] = JSON.parse(raw);
    const now = new Date().getTime();
    let changed = false;

    const filtered = appointments.filter(apt => {
      if (apt.status === 'HELD' && apt.heldUntil) {
        const expires = new Date(apt.heldUntil).getTime();
        if (now > expires) {
          changed = true;
          return false; // Remove / release the slot
        }
      }
      return true;
    });

    if (changed) {
      localStorage.setItem('medsync_appointments', JSON.stringify(filtered));
    }
  }

  // Auth
  static registerPatient(email: string, name: string, password = ''): User {
    const users = this.getUsers();
    const patients = this.getPatients();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const userId = 'user-' + Math.random().toString(36).substr(2, 9);
    const patientId = 'pat-' + Math.random().toString(36).substr(2, 9);

    const newUser: User = {
      id: userId,
      email,
      role: 'PATIENT',
      name,
      password: password || '123456',
      createdAt: new Date().toISOString(),
    };

    const newPatient: PatientProfile = {
      id: patientId,
      userId,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    patients.push(newPatient);

    localStorage.setItem('medsync_users', JSON.stringify(users));
    localStorage.setItem('medsync_patients', JSON.stringify(patients));

    return newUser;
  }

  // Admin creating doctor
  static registerDoctor(email: string, name: string, specialization: string, slotDuration: number = 30): DoctorProfile {
    const users = this.getUsers();
    const doctors = this.getDoctors();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const userId = 'user-' + Math.random().toString(36).substr(2, 9);
    const docId = 'doc-' + Math.random().toString(36).substr(2, 9);

    const newUser: User = {
      id: userId,
      email,
      role: 'DOCTOR',
      name,
      createdAt: new Date().toISOString(),
    };

    const newDoc: DoctorProfile = {
      id: docId,
      userId,
      name,
      specialization,
      email,
      slotDuration,
      workingHours: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      ],
      leaveDays: [],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    doctors.push(newDoc);

    localStorage.setItem('medsync_users', JSON.stringify(users));
    localStorage.setItem('medsync_doctors', JSON.stringify(doctors));

    return newDoc;
  }

  // Edit Doctor Profile
  static updateDoctorProfile(id: string, name: string, specialization: string, slotDuration: number, workingHours: WorkingHour[], email?: string) {
    const doctors = this.getDoctors();
    const index = doctors.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Doctor not found');

    const doc = doctors[index];
    doc.name = name;
    doc.specialization = specialization;
    doc.slotDuration = slotDuration;
    doc.workingHours = workingHours;
    if (email) doc.email = email;

    localStorage.setItem('medsync_doctors', JSON.stringify(doctors));

    // Update matching user record
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.id === doc.userId);
    if (userIdx !== -1) {
      users[userIdx].name = name;
      if (email) users[userIdx].email = email;
      localStorage.setItem('medsync_users', JSON.stringify(users));
    }
  }

  // Doctor Leave management (Admin action)
  static markDoctorLeave(doctorId: string, dateStr: string) {
    const doctors = this.getDoctors();
    const docIdx = doctors.findIndex(d => d.id === doctorId);
    if (docIdx === -1) throw new Error('Doctor not found');

    const doc = doctors[docIdx];
    if (!doc.leaveDays.includes(dateStr)) {
      doc.leaveDays.push(dateStr);
    }
    localStorage.setItem('medsync_doctors', JSON.stringify(doctors));

    // Handle existing appointments on that date
    const appointments = this.getAppointments();
    let affectedCount = 0;

    const updatedAppointments = appointments.map(apt => {
      if (apt.doctorId === doctorId && apt.date === dateStr && (apt.status === 'CONFIRMED' || apt.status === 'HELD')) {
        affectedCount++;
        // Trigger notification simulation
        this.addNotification({
          id: 'notif-' + Math.random().toString(36).substr(2, 9),
          type: 'DOCTOR_LEAVE',
          recipientEmail: apt.patient?.email || 'patient@example.com',
          message: `Dear ${apt.patient?.name || 'Patient'}, your appointment with ${doc.name} on ${dateStr} at ${apt.startTime} has been cancelled because the doctor is on leave. Please reschedule your visit.`,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
        
        return {
          ...apt,
          status: 'CANCELLED_BY_DOCTOR_LEAVE' as const
        };
      }
      return apt;
    });

    localStorage.setItem('medsync_appointments', JSON.stringify(updatedAppointments));
    return affectedCount;
  }

  static markDoctorLeaveRange(doctorId: string, startDateStr: string, endDateStr: string) {
    const doctors = this.getDoctors();
    const docIdx = doctors.findIndex(d => d.id === doctorId);
    if (docIdx === -1) throw new Error('Doctor not found');

    const doc = doctors[docIdx];
    const leaveDates: string[] = [];
    let current = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      leaveDates.push(dateStr);
      if (!doc.leaveDays.includes(dateStr)) {
        doc.leaveDays.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    localStorage.setItem('medsync_doctors', JSON.stringify(doctors));

    // Log leave range to history
    const history = this.getLeaveHistory();
    history.push({
      id: 'leave-' + Math.random().toString(36).substr(2, 9),
      doctorId,
      startDate: startDateStr,
      endDate: endDateStr,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('medsync_leave_history', JSON.stringify(history));

    // Handle existing appointments in range
    const appointments = this.getAppointments();
    let affectedCount = 0;

    const updatedAppointments = appointments.map(apt => {
      if (apt.doctorId === doctorId && leaveDates.includes(apt.date) && (apt.status === 'CONFIRMED' || apt.status === 'HELD')) {
        affectedCount++;
        // Trigger notification simulation
        this.addNotification({
          id: 'notif-' + Math.random().toString(36).substr(2, 9),
          type: 'DOCTOR_LEAVE',
          recipientEmail: apt.patient?.email || 'patient@example.com',
          message: `Dear ${apt.patient?.name || 'Patient'}, your appointment with ${doc.name} on ${apt.date} at ${apt.startTime} has been cancelled because the doctor is on leave. Please reschedule your visit.`,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
        
        return {
          ...apt,
          status: 'CANCELLED_BY_DOCTOR_LEAVE' as const
        };
      }
      return apt;
    });

    localStorage.setItem('medsync_appointments', JSON.stringify(updatedAppointments));
    return affectedCount;
  }

  // Booking Flow: Hold Slot
  static holdSlot(doctorId: string, dateStr: string, startTime: string, endTime: string, patientId: string): Appointment {
    const doctors = this.getDoctors();
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) throw new Error('Doctor not found');

    // Check if doctor is on leave
    if (doc.leaveDays.includes(dateStr)) {
      throw new Error('Doctor is on leave on this date');
    }

    // Verify double-booking
    const appointments = this.getAppointments();
    const conflict = appointments.some(apt => 
      apt.doctorId === doctorId && 
      apt.date === dateStr && 
      apt.startTime === startTime && 
      (apt.status === 'CONFIRMED' || (apt.status === 'HELD' && new Date(apt.heldUntil || '').getTime() > Date.now()))
    );

    if (conflict) {
      throw new Error('409 Conflict: This slot is no longer available.');
    }

    // Expiration details (5 minutes hold)
    const holdDurationMs = 5 * 60 * 1000;
    const heldUntil = new Date(Date.now() + holdDurationMs).toISOString();

    const newApt: Appointment = {
      id: 'apt-' + Math.random().toString(36).substr(2, 9),
      patientId,
      doctorId,
      date: dateStr,
      startTime,
      endTime,
      status: 'HELD',
      heldUntil,
    };

    appointments.push(newApt);
    localStorage.setItem('medsync_appointments', JSON.stringify(appointments));

    return newApt;
  }

  // Confirm Hold Appointment & Submit Symptoms
  static confirmAppointment(appointmentId: string, symptomsText: string): Appointment {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) throw new Error('Appointment hold not found or expired');

    const apt = appointments[index];
    if (apt.status !== 'HELD') {
      throw new Error('Appointment is not in a holdable state');
    }

    // Check hold expiration
    if (apt.heldUntil && new Date(apt.heldUntil).getTime() < Date.now()) {
      throw new Error('Appointment hold expired. Please re-book.');
    }

    // Create symptom submission
    const symptoms = this.getSymptoms();
    const newSymptom: SymptomSubmission = {
      id: 'sym-' + Math.random().toString(36).substr(2, 9),
      appointmentId,
      symptoms: symptomsText,
      // Simulate AI processing output
      urgency: symptomsText.toLowerCase().includes('chest pain') || symptomsText.toLowerCase().includes('breathing') ? 'High' : (symptomsText.length > 50 ? 'Medium' : 'Low'),
      chiefComplaint: symptomsText.substring(0, 40) + (symptomsText.length > 40 ? '...' : ''),
      suggestedQuestions: [
        'How long have you experienced these specific symptoms?',
        'Does anything make the symptoms feel better or worse?',
        'Have you taken any over-the-counter medications for this?'
      ],
      createdAt: new Date().toISOString()
    };
    symptoms.push(newSymptom);
    localStorage.setItem('medsync_symptoms', JSON.stringify(symptoms));

    // Confirm appointment status
    apt.status = 'CONFIRMED';
    delete apt.heldUntil;

    localStorage.setItem('medsync_appointments', JSON.stringify(appointments));

    // Trigger Notification simulation
    const patient = this.getPatients().find(p => p.id === apt.patientId);
    const doctor = this.getDoctors().find(d => d.id === apt.doctorId);
    
    this.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      type: 'BOOKING_CONFIRMED',
      recipientEmail: patient?.email || 'patient@example.com',
      message: `Hi ${patient?.name}, your appointment with ${doctor?.name} is confirmed for ${apt.date} at ${apt.startTime}.`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    this.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      type: 'BOOKING_CONFIRMED',
      recipientEmail: doctor?.email || 'doctor@example.com',
      message: `Doctor, you have a new appointment with patient ${patient?.name} on ${apt.date} at ${apt.startTime}.`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    return apt;
  }

  // Cancel Appointment
  static cancelAppointment(id: string) {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');

    const apt = appointments[index];
    apt.status = 'CANCELLED';
    localStorage.setItem('medsync_appointments', JSON.stringify(appointments));

    const patient = this.getPatients().find(p => p.id === apt.patientId);
    const doctor = this.getDoctors().find(d => d.id === apt.doctorId);

    this.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      type: 'CANCELLATION',
      recipientEmail: patient?.email || 'patient@example.com',
      message: `Your appointment with ${doctor?.name} on ${apt.date} at ${apt.startTime} has been cancelled.`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    this.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      type: 'CANCELLATION',
      recipientEmail: doctor?.email || 'doctor@example.com',
      message: `Appointment with patient ${patient?.name} on ${apt.date} at ${apt.startTime} has been cancelled.`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  // Submit Doctor Consultation notes and Prescription
  static submitConsultation(appointmentId: string, notes: string, meds: Omit<Medication, 'id' | 'prescriptionId'>[], followUp: string) {
    const appointments = this.getAppointments();
    const aptIdx = appointments.findIndex(a => a.id === appointmentId);
    if (aptIdx === -1) throw new Error('Appointment not found');

    // Add Consultation
    const consultations = this.getConsultations();
    const newConsultation: Consultation = {
      id: 'cons-' + Math.random().toString(36).substr(2, 9),
      appointmentId,
      clinicalNotes: notes,
      createdAt: new Date().toISOString()
    };
    consultations.push(newConsultation);
    localStorage.setItem('medsync_consultations', JSON.stringify(consultations));

    // Add Prescription
    const prescriptions = this.getPrescriptions();
    const presId = 'pres-' + Math.random().toString(36).substr(2, 9);
    const newPrescription: Prescription = {
      id: presId,
      appointmentId,
      medications: meds.map((m, idx) => ({
        ...m,
        id: `med-${presId}-${idx}`,
        prescriptionId: presId
      })),
      followUpInstructions: followUp,
      createdAt: new Date().toISOString()
    };
    prescriptions.push(newPrescription);
    localStorage.setItem('medsync_prescriptions', JSON.stringify(prescriptions));

    // Complete appointment status
    appointments[aptIdx].status = 'COMPLETED';
    localStorage.setItem('medsync_appointments', JSON.stringify(appointments));

    // Mock AI summary generation (simulate delay / possible retry states)
    this.generateAiSummary(appointmentId, notes, meds, followUp);
  }

  // AI Summary Generator Mock
  private static generateAiSummary(appointmentId: string, notes: string, meds: any[], followUp: string) {
    // We store this as an AISummary state.
    const aiSummaries = JSON.parse(localStorage.getItem('medsync_ai_summaries') || '[]');
    
    // Simulating normal AI behavior:
    const newSummary = {
      id: 'ai-' + Math.random().toString(36).substr(2, 9),
      appointmentId,
      summaryText: `Patient visited regarding clinical concerns. The doctor recommended rest and a specific medication schedule: ${meds.map(m => m.name).join(', ')}.`,
      medicationSchedule: meds.map(m => `- ${m.name}: Take ${m.dosage} ${m.frequency} for ${m.duration}.`).join('\n'),
      followUpSteps: followUp || 'Return to clinic if symptoms worsen.',
      status: 'SUCCESS' as const,
      createdAt: new Date().toISOString()
    };

    aiSummaries.push(newSummary);
    localStorage.setItem('medsync_ai_summaries', JSON.stringify(aiSummaries));
  }

  static getAiSummaries(): any[] {
    return JSON.parse(localStorage.getItem('medsync_ai_summaries') || '[]');
  }

  // Notifications helper
  static addNotification(notif: any) {
    const notifs = this.getNotifications();
    notifs.push(notif);
    localStorage.setItem('medsync_notifications', JSON.stringify(notifs));
  }

  static updateUserProfile(userId: string, data: { name: string; email: string; phone?: string; password?: string }) {
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('User not found');

    const user = users[userIdx];
    user.name = data.name;
    user.email = data.email;
    if (data.phone) user.phone = data.phone;
    if (data.password) user.password = data.password;
    localStorage.setItem('medsync_users', JSON.stringify(users));

    if (user.role === 'PATIENT') {
      const patients = this.getPatients();
      const patIdx = patients.findIndex(p => p.userId === userId);
      if (patIdx !== -1) {
        patients[patIdx].name = data.name;
        patients[patIdx].email = data.email;
        if (data.phone) patients[patIdx].phone = data.phone;
        localStorage.setItem('medsync_patients', JSON.stringify(patients));
      }
    } else if (user.role === 'DOCTOR') {
      const doctors = this.getDoctors();
      const docIdx = doctors.findIndex(d => d.userId === userId);
      if (docIdx !== -1) {
        doctors[docIdx].name = data.name;
        doctors[docIdx].email = data.email;
        if (data.phone) doctors[docIdx].phone = data.phone;
        localStorage.setItem('medsync_doctors', JSON.stringify(doctors));
      }
    }

    return user;
  }

  static cancelLeaveEarly(doctorId: string, dateFromStr: string) {
    const doctors = this.getDoctors();
    const docIdx = doctors.findIndex(d => d.id === doctorId);
    if (docIdx === -1) throw new Error('Doctor not found');
    const doc = doctors[docIdx];
    
    // Filter out leave days from dateFromStr onwards
    const fromDate = new Date(dateFromStr);
    const keptLeaves = doc.leaveDays.filter(dayStr => {
      const d = new Date(dayStr);
      return d < fromDate;
    });
    const removedLeaves = doc.leaveDays.filter(dayStr => {
      const d = new Date(dayStr);
      return d >= fromDate;
    });

    doc.leaveDays = keptLeaves;
    localStorage.setItem('medsync_doctors', JSON.stringify(doctors));

    // Update active records in history from ACTIVE to RESUMED_EARLY
    const history = this.getLeaveHistory();
    const updatedHistory = history.map(h => {
      if (h.doctorId === doctorId && h.status === 'ACTIVE') {
        const hStart = new Date(h.startDate);
        const hEnd = new Date(h.endDate);
        if (fromDate >= hStart && fromDate <= hEnd) {
          return {
            ...h,
            status: 'RESUMED_EARLY' as const,
            endDate: dateFromStr // change endDate to date of return
          };
        }
      }
      return h;
    });
    localStorage.setItem('medsync_leave_history', JSON.stringify(updatedHistory));

    // Find patients whose appointments were cancelled on these removed leave dates
    const appointments = this.getAppointments();
    const affectedPatients = new Set<string>();
    
    appointments.forEach(apt => {
      if (apt.doctorId === doctorId && removedLeaves.includes(apt.date) && apt.status === 'CANCELLED_BY_DOCTOR_LEAVE') {
        if (apt.patient?.email) {
          affectedPatients.add(apt.patient.email);
        }
      }
    });

    // Notify all patients that the doctor is back
    const patients = this.getPatients();
    patients.forEach(pat => {
      const isAffected = affectedPatients.has(pat.email);
      this.addNotification({
        id: 'notif-' + Math.random().toString(36).substr(2, 9),
        type: 'DOCTOR_RETURN',
        recipientEmail: pat.email,
        message: `Good news! ${doc.name} has returned from leave early and is now accepting appointments from ${dateFromStr} onwards.${isAffected ? ' Since you had a cancelled booking, you can now reschedule your visit.' : ''}`,
        status: 'PENDING',
        read: false,
        createdAt: new Date().toISOString()
      });
    });
  }

  static markNotificationRead(id: string) {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      localStorage.setItem('medsync_notifications', JSON.stringify(notifs));
    }
  }

  static markAllNotificationsRead(recipientEmail: string) {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => {
      if (n.recipientEmail === recipientEmail) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('medsync_notifications', JSON.stringify(updated));
  }
}
