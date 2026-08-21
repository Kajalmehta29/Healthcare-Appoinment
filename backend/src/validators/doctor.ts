import { z } from 'zod';

export const createDoctorSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  specialization: z.string().min(2, 'Specialization is required.'),
  slotDuration: z.number().int().positive().default(30),
});

export const workingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format.'),
});

export const updateDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  specialization: z.string().min(2, 'Specialization is required.'),
  slotDuration: z.number().int().positive(),
  email: z.string().email('Invalid email address format.'),
  workingHours: z.array(workingHourSchema).optional(),
});
