import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthIdentity } from './useAuthIdentity';

describe('useAuthIdentity', () => {
  it('loads guest identity from /api/auth/me on startup', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        identityType: 'guest',
        displayName: 'Guest-ABCD',
        user: null,
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuthIdentity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' });
    expect(result.current.identity?.identityType).toBe('guest');

    vi.unstubAllGlobals();
  });
});
