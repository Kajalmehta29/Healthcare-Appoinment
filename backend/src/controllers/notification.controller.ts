import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationController {
  static async list(req: Request, res: Response) {
    const { recipientEmail } = req.query;
    try {
      const filters: any = {};
      if (recipientEmail && typeof recipientEmail === 'string') {
        filters.recipientEmail = recipientEmail;
      }
      const list = await prisma.notification.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
      });
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true },
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    const { recipientEmail } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'recipientEmail is required.' });
    try {
      await prisma.notification.updateMany({
        where: { recipientEmail, read: false },
        data: { read: true },
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
