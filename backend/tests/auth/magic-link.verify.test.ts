import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';
import { magicLinkService } from '../../src/auth/magic-link/MagicLinkService';

describe('POST /api/auth/magic-link/verify', () => {
  it('upgrades session to account identity on valid token', async () => {
    const app = createApp();
    const agent = request.agent(app);
    const email = 'verify@example.com';

    const startRes = await agent.post('/api/auth/magic-link/start').send({ email });
    expect(startRes.status).toBe(200);

    const token = magicLinkService.peekLatestTokenForEmail(email);
    expect(token).toBeTruthy();

    const verifyRes = await agent
      .post('/api/auth/magic-link/verify')
      .send({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.identityType).toBe('account');

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.identityType).toBe('account');
  });
});
