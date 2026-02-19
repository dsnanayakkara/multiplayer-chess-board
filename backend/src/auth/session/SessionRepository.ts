import { SessionIdentity } from '../types';

export interface SessionRepository {
  get(sessionId: string): Promise<SessionIdentity | null>;
  set(sessionId: string, identity: SessionIdentity, ttlSeconds?: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
}

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, SessionIdentity>();

  async get(sessionId: string): Promise<SessionIdentity | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(sessionId: string, identity: SessionIdentity): Promise<void> {
    this.sessions.set(sessionId, identity);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
