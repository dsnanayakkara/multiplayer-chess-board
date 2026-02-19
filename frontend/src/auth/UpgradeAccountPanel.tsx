import { useState } from 'react';

interface UpgradeAccountPanelProps {
  onSent: () => void;
}

export const UpgradeAccountPanel = ({ onSent }: UpgradeAccountPanelProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendMagicLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/magic-link/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Unable to send magic link');
      }

      setSuccess('Magic link sent. Check your email.');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px' }}>Upgrade Account</h3>
      <p style={{ marginTop: 0, marginBottom: '12px', color: '#666', fontSize: '14px' }}>
        Save your identity with a magic link.
      </p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '2px solid #e0e0e0',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
        disabled={loading}
      />
      <button
        type="button"
        onClick={sendMagicLink}
        disabled={loading || !email.trim()}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: 'none',
          background: '#334155',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Send Magic Link
      </button>
      {error ? <p style={{ color: '#c33', marginBottom: 0 }}>{error}</p> : null}
      {success ? <p style={{ color: '#2e7d32', marginBottom: 0 }}>{success}</p> : null}
    </div>
  );
};
