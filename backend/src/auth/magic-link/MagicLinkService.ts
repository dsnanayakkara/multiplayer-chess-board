import { randomBytes, randomUUID } from 'crypto';
import { ConsoleEmailSender } from '../email/ConsoleEmailSender';
import { EmailSender } from '../email/EmailSender';

interface MagicLinkRecord {
  email: string;
  expiresAt: number;
  usedAt?: number;
  requestedIp: string;
  userAgent: string;
}

export interface VerifiedUser {
  id: string;
  email: string;
  displayName: string;
}

export type VerifyResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; code: 'AUTH_INVALID_TOKEN' | 'AUTH_TOKEN_EXPIRED' | 'AUTH_TOKEN_USED' };

export class MagicLinkService {
  private tokens = new Map<string, MagicLinkRecord>();
  private readonly ttlMs: number;
  private readonly appUrl: string;
  private readonly emailSender: EmailSender;

  constructor(options?: { ttlMs?: number; appUrl?: string; emailSender?: EmailSender }) {
    this.ttlMs = options?.ttlMs ?? 15 * 60 * 1000;
    this.appUrl = options?.appUrl ?? process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
    this.emailSender = options?.emailSender ?? new ConsoleEmailSender();
  }

  async start(email: string, requestedIp: string, userAgent: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.ttlMs;

    this.tokens.set(token, {
      email: normalizedEmail,
      expiresAt,
      requestedIp,
      userAgent,
    });

    const url = `${this.appUrl}/?token=${encodeURIComponent(token)}`;
    await this.emailSender.sendMagicLink(normalizedEmail, url);
  }

  async verify(token: string): Promise<VerifyResult> {
    const record = this.tokens.get(token);
    if (!record) {
      return { ok: false, code: 'AUTH_INVALID_TOKEN' };
    }

    if (record.usedAt) {
      return { ok: false, code: 'AUTH_TOKEN_USED' };
    }

    if (record.expiresAt < Date.now()) {
      return { ok: false, code: 'AUTH_TOKEN_EXPIRED' };
    }

    record.usedAt = Date.now();

    return {
      ok: true,
      user: {
        id: randomUUID(),
        email: record.email,
        displayName: record.email.split('@')[0] || 'Player',
      },
    };
  }
}

export const magicLinkService = new MagicLinkService();
