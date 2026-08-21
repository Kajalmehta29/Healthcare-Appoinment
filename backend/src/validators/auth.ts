import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.').optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Invalid email address format.'),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters long.').optional().nullable(),
});
