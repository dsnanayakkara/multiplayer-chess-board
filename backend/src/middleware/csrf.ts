import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const CSRF_COOKIE_NAME = 'csrf_token';

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

export const issueCsrfToken = (_req: Request, res: Response): string => {
  const token = randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });

  return token;
};

export const requireCsrf = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.get('x-csrf-token');
  const cookieToken = parseCookie(req.headers.cookie, CSRF_COOKIE_NAME);

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ code: 'CSRF_INVALID' });
  }

  return next();
};
