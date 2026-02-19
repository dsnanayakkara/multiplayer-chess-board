import type { AuthIdentity } from './types';

export const getMe = async (): Promise<AuthIdentity> => {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load identity');
  }

  return response.json() as Promise<AuthIdentity>;
};
