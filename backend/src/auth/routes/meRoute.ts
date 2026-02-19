import { Router, Request } from 'express';
import { SessionIdentity } from '../types';

export const meRoute = Router();

meRoute.get('/me', (req, res) => {
  const identity = (req as Request & { identity?: SessionIdentity }).identity;

  if (!identity) {
    return res.status(500).json({ message: 'Session identity not initialized' });
  }

  const displayName = identity.displayName || `Guest-${identity.guestId.slice(0, 4).toUpperCase()}`;
  const identityType = identity.userId ? 'account' : 'guest';

  return res.json({
    identityType,
    displayName,
    user: identity.userId
      ? {
          id: identity.userId,
          displayName,
        }
      : null,
  });
});
