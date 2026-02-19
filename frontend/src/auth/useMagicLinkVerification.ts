import { useEffect, useState } from 'react';
import { apiUrl } from './authApi';

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'error';

interface UseMagicLinkVerificationOptions {
  onVerified: () => Promise<void> | void;
}

export const useMagicLinkVerification = ({ onVerified }: UseMagicLinkVerificationOptions) => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        setStatus('verifying');
        setError(null);

        const response = await fetch(apiUrl('/api/auth/magic-link/verify'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Magic link verification failed');
        }

        await onVerified();
        setStatus('verified');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Magic link verification failed');
      }
    };

    void verify();
  }, [onVerified]);

  return {
    status,
    error,
  };
};
