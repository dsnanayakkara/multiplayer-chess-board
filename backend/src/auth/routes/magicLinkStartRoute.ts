import { Router } from 'express';
import { allowMagicLinkStart } from '../rateLimit';
import { magicLinkService } from '../magic-link/MagicLinkService';
import { AppError } from '../../errors/AppError';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const magicLinkStartRoute = Router();

magicLinkStartRoute.post('/magic-link/start', async (req, res, next) => {
  try {
    const email = req.body?.email;

    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ code: 'AUTH_INVALID_EMAIL' });
    }

    const key = `${req.ip || 'unknown'}:${email.toLowerCase()}`;
    if (!allowMagicLinkStart(key)) {
      throw new AppError('Too many attempts', 429, 'AUTH_RATE_LIMITED');
    }

    await magicLinkService.start(email, req.ip || 'unknown', req.get('user-agent') || 'unknown');
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
