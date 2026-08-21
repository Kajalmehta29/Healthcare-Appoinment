import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { loginSchema, registerSchema, updateProfileSchema } from '../validators/auth';

export class AuthController {
  static async login(req: any, res: Response) {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await AuthService.login(parsed.email, parsed.password);
      return res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: 'User not found. Use admin@medsync.com, doctor@medsync.com, or patient@medsync.com to log in, or register a new patient account.',
        });
      }
      if (error.message === 'INVALID_PASSWORD') {
        return res.status(401).json({ error: 'Incorrect password. Please verify your credentials.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async register(req: any, res: Response) {
    try {
      const parsed = registerSchema.parse(req.body);
      const result = await AuthService.register(parsed.email, parsed.name, parsed.password);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      if (error.message === 'EMAIL_ALREADY_IN_USE') {
        return res.status(400).json({ error: 'Email address is already in use.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const user = await AuthService.getUserById(req.user.id);
      return res.json(user);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(req.user.id, parsed);
      return res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
        return res.status(400).json({ error: msg });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}
