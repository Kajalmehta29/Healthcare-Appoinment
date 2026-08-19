export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  phone?: string;
  password?: string;
  createdAt: string;
}

export interface WorkingHour {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  email: string;
  phone?: string;
  workingHours: WorkingHour[];
  slotDuration: number; // in minutes, e.g. 30
  leaveDays: string[]; // array of ISO strings "YYYY-MM-DD"
  createdAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export type AppointmentStatus =
  | 'AVAILABLE'
  | 'HELD'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_BY_DOCTOR_LEAVE';

export interface SymptomSubmission {
  id: string;
  appointmentId: string;
  symptoms: string;
  urgency: 'Low' | 'Medium' | 'High' | 'PENDING' | 'FAILED';
  chiefComplaint: string;
  suggestedQuestions: string[];
  createdAt: string;
}

export interface AISummary {
  id: string;
  appointmentId: string;
  summaryText: string;
  medicationSchedule: string;
  followUpSteps: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface Medication {
  id: string;
  prescriptionId: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "2 times/day"
  duration: string; // e.g. "5 days"
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medications: Medication[];
  followUpInstructions?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  clinicalNotes: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string | null;
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  status: AppointmentStatus;
  heldUntil?: string; // ISO string
  createdAt?: string; // ISO string
  patient?: PatientProfile;
  doctor?: DoctorProfile;
  symptoms?: SymptomSubmission;
  consultation?: Consultation;
  prescription?: Prescription;
  aiSummary?: AISummary;
}

export interface LeaveRecord {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'RESUMED_EARLY' | 'COMPLETED';
  createdAt: string;
}
