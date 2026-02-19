import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { SessionIdentity } from '../types';
import { InMemorySessionRepository, SessionRepository } from './SessionRepository';
import { RedisSessionRepository } from './RedisSessionRepository';

const COOKIE_NAME = 'sid';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionService {
  rotateToUser(req: Request, res: Response, user: { id: string; displayName: string }): Promise<void>;
  logoutToGuest(req: Request, res: Response): Promise<void>;
}

const defaultRepository: SessionRepository =
  process.env.NODE_ENV === 'test'
    ? new InMemorySessionRepository()
    : new RedisSessionRepository();

const parseCookie = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(part => part.trim());
  const entry = cookies.find(item => item.startsWith(`${name}=`));
  if (!entry) {
    return null;
  }

  return entry.slice(name.length + 1);
};

const writeSessionCookie = (res: Response, sessionId: string) => {
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
};

export const sessionMiddleware = (sessionRepository: SessionRepository = defaultRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      let sessionId = parseCookie(req.headers.cookie, COOKIE_NAME) || randomUUID();
      let identity = await sessionRepository.get(sessionId);

      if (!identity) {
        identity = {
          sessionId,
          guestId: randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
      } else {
        identity = {
          ...identity,
          updatedAt: now,
        };
      }

      await sessionRepository.set(sessionId, identity, SESSION_TTL_SECONDS);

      writeSessionCookie(res, sessionId);

      const sessionService: SessionService = {
        rotateToUser: async (request, response, user) => {
          const currentIdentity = (request as Request & { identity?: SessionIdentity }).identity;
          if (currentIdentity) {
            await sessionRepository.delete(currentIdentity.sessionId);
          }

          const nextSessionId = randomUUID();
          const nextIdentity: SessionIdentity = {
            sessionId: nextSessionId,
            guestId: currentIdentity?.guestId || randomUUID(),
            userId: user.id,
            displayName: user.displayName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await sessionRepository.set(nextSessionId, nextIdentity, SESSION_TTL_SECONDS);
          writeSessionCookie(response, nextSessionId);
          (request as Request & { identity?: SessionIdentity }).identity = nextIdentity;
        },
        logoutToGuest: async (request, response) => {
          const currentIdentity = (request as Request & { identity?: SessionIdentity }).identity;
          if (currentIdentity) {
            await sessionRepository.delete(currentIdentity.sessionId);
          }

          const nextSessionId = randomUUID();
          const nextIdentity: SessionIdentity = {
            sessionId: nextSessionId,
            guestId: randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await sessionRepository.set(nextSessionId, nextIdentity, SESSION_TTL_SECONDS);
          writeSessionCookie(response, nextSessionId);
          (request as Request & { identity?: SessionIdentity }).identity = nextIdentity;
        },
      };

      (req as Request & { identity?: SessionIdentity }).identity = identity;
      (req as Request & { sessionRepository?: SessionRepository }).sessionRepository = sessionRepository;
      (req as Request & { sessionService?: SessionService }).sessionService = sessionService;
      next();
    } catch (error) {
      next(error);
    }
  };
};
