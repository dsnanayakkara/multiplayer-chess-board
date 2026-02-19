import type { AuthIdentity } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || import.meta.env.VITE_SOCKET_URL
  || 'http://localhost:3001';

export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

export const getMe = async (): Promise<AuthIdentity> => {
  const response = await fetch(apiUrl('/api/auth/me'), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load identity');
  }

  return response.json() as Promise<AuthIdentity>;
};
