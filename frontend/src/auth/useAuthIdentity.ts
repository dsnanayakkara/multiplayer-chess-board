import { useCallback, useEffect, useState } from 'react';
import { getMe } from './authApi';
import type { AuthIdentity } from './types';

export const useAuthIdentity = () => {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIdentity = useCallback(async () => {
    try {
      setLoading(true);
      const nextIdentity = await getMe();
      setIdentity(nextIdentity);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load identity');
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIdentity();
  }, [refreshIdentity]);

  return {
    identity,
    loading,
    error,
    refreshIdentity,
    setIdentity,
  };
};
