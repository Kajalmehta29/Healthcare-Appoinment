import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', async (req, res) => {
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
});

// POST /api/notifications/:id/read
router.post('/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req, res) => {
  const { recipientEmail } = req.body;
  if (!recipientEmail) {
    return res.status(400).json({ error: 'recipientEmail is required.' });
  }

  try {
    await prisma.notification.updateMany({
      where: { recipientEmail, read: false },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
