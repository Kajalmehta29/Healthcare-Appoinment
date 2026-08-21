import { z } from 'zod';

export const holdSlotSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required.'),
  patientId: z.string().min(1, 'Patient ID is required.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format.'),
});

export const confirmSlotSchema = z.object({
  symptoms: z.string().min(5, 'Symptoms must be at least 5 characters long.'),
});

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.string().min(1, 'Frequency is required.'),
  duration: z.string().min(1, 'Duration is required.'),
});

export const submitConsultationSchema = z.object({
  notes: z.string().min(5, 'Clinical notes must be at least 5 characters long.'),
  medications: z.array(medicationSchema).optional().default([]),
  followUp: z.string().optional().default(''),
});
