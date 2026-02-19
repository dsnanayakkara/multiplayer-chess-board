import { Request, Router } from 'express';
import { magicLinkService } from '../magic-link/MagicLinkService';
import { SessionService } from '../session/sessionMiddleware';

export const magicLinkVerifyRoute = Router();

magicLinkVerifyRoute.post('/magic-link/verify', async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== 'string' || token.length < 20) {
    return res.status(400).json({ code: 'AUTH_INVALID_TOKEN' });
  }

  const result = await magicLinkService.verify(token);
  if (!result.ok) {
    return res.status(400).json({ code: result.code });
  }

  const sessionService = (req as Request & { sessionService?: SessionService }).sessionService;
  if (!sessionService) {
    return res.status(500).json({ code: 'SESSION_NOT_INITIALIZED' });
  }

  await sessionService.rotateToUser(req, res, result.user);
  return res.json({
    ok: true,
    identityType: 'account',
    user: result.user,
  });
});
