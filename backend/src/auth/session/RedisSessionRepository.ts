import { getRedis } from '../../db/redis';
import { SessionIdentity } from '../types';
import { SessionRepository } from './SessionRepository';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

export class RedisSessionRepository implements SessionRepository {
  async get(sessionId: string): Promise<SessionIdentity | null> {
    const raw = await getRedis().get(this.key(sessionId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SessionIdentity;
  }

  async set(sessionId: string, identity: SessionIdentity, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    await getRedis().set(this.key(sessionId), JSON.stringify(identity), 'EX', ttlSeconds);
  }

  async delete(sessionId: string): Promise<void> {
    await getRedis().del(this.key(sessionId));
  }

  private key(sessionId: string): string {
    return `sess:${sessionId}`;
  }
}
