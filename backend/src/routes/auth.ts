import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { getGoogleAuthUrl, handleGoogleCallback, unlinkGoogleConnection, verifyGoogleConnection } from '../integrations/google-calendar/calendar';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', authenticateToken, AuthController.me);
router.put('/profile', authenticateToken, AuthController.updateProfile);

router.get('/google/url', authenticateToken, (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const url = getGoogleAuthUrl(req.user.id);
  if (!url) {
    return res.status(400).json({ error: 'Google client credentials not configured on backend.' });
  }
  return res.json({ url });
});

router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send('Missing code or state parameters.');
  }
  try {
    await handleGoogleCallback(state as string, code as string);
    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2 style="color: #10B981;">Google Calendar Linked Successfully!</h2>
          <p>Medsync is now linked to your calendar. You can close this window.</p>
          <script>setTimeout(() => window.close(), 2000);</script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google OAuth callback trade failed:', error);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

router.post('/google/unlink', authenticateToken, async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await unlinkGoogleConnection(req.user.id);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to unlink Google Calendar:', error);
    return res.status(500).json({ error: error.message || 'Failed to unlink Google Calendar' });
  }
});

router.post('/google/refresh-status', authenticateToken, async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const isGoogleLinked = await verifyGoogleConnection(req.user.id);
    return res.json({ isGoogleLinked });
  } catch (error: any) {
    console.error('Failed to refresh Google Calendar status:', error);
    return res.status(500).json({ error: error.message || 'Failed to check status' });
  }
});

export default router;
