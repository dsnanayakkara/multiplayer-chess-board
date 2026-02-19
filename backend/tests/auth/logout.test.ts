import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';
import { magicLinkService } from '../../src/auth/magic-link/MagicLinkService';

describe('POST /api/auth/logout', () => {
  it('returns ok and resets to guest session', async () => {
    const app = createApp();
    const agent = request.agent(app);
    const email = 'logout@example.com';

    await agent.post('/api/auth/magic-link/start').send({ email });
    const token = magicLinkService.peekLatestTokenForEmail(email);

    await agent.post('/api/auth/magic-link/verify').send({ token });

    const csrfRes = await agent.get('/api/auth/csrf');
    const logoutRes = await agent
      .post('/api/auth/logout')
      .set('x-csrf-token', csrfRes.body.token);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.ok).toBe(true);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.identityType).toBe('guest');
  });
});
