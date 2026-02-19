import { Router } from 'express';
import { magicLinkService } from '../magic-link/MagicLinkService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const magicLinkStartRoute = Router();

magicLinkStartRoute.post('/magic-link/start', async (req, res) => {
  const email = req.body?.email;

  if (typeof email !== 'string' || !emailRegex.test(email)) {
    return res.status(400).json({ code: 'AUTH_INVALID_EMAIL' });
  }

  await magicLinkService.start(email, req.ip || 'unknown', req.get('user-agent') || 'unknown');
  return res.json({ ok: true });
});
