import { Request, Router } from 'express';
import { SessionService } from '../session/sessionMiddleware';

export const logoutRoute = Router();

logoutRoute.post('/logout', async (req, res) => {
  const sessionService = (req as Request & { sessionService?: SessionService }).sessionService;
  if (!sessionService) {
    return res.status(500).json({ code: 'SESSION_NOT_INITIALIZED' });
  }

  await sessionService.logoutToGuest(req, res);
  return res.json({ ok: true });
});
