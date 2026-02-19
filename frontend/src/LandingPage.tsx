import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface LandingPageProps {
  socket: Socket | null;
  onRoomJoined: () => void;
  defaultPlayerName?: string;
}

export const LandingPage = ({ socket, onRoomJoined, defaultPlayerName }: LandingPageProps) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!defaultPlayerName || playerName.trim()) {
      return;
    }

    setPlayerName(defaultPlayerName);
  }, [defaultPlayerName, playerName]);

  useEffect(() => {
    if (!socket) return;

    // Listen for errors from server
    const handleError = (data: { message: string; code?: string }) => {
      setLoading(false);

      // Provide contextual error messages based on error code
      if (data.code === 'ROOM_NOT_FOUND') {
        setError(
          'Room not found. The host may have left before you joined, or the room code is incorrect. ' +
          'Please ask them to create a new room or double-check the code.'
        );
      } else if (data.code === 'GAME_ENDED') {
        setError(
          'This game has already ended. Please create a new room or join a different one.'
        );
      } else {
        // Fallback to default message
        setError(data.message || 'An error occurred');
      }
    };

    socket.on('error', handleError);

    return () => {
      socket.off('error', handleError);
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setLoading(true);
    setError('');

    socket.emit('create-room', { playerName: playerName.trim() });
    onRoomJoined();
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter room code');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setLoading(true);
    setError('');

    socket.emit('join-room', { roomId: roomCode.toUpperCase(), playerName: playerName.trim() });
    onRoomJoined();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Multiplayer Chess</h1>
        <p style={styles.subtitle}>Play chess online with friends!</p>

        <div style={styles.form}>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={styles.input}
            disabled={loading}
          />

          <div style={styles.divider}>
            <button
              onClick={handleCreateRoom}
              style={styles.primaryButton}
              disabled={loading || !playerName.trim()}
            >
              Create New Room
            </button>
          </div>

          <div style={styles.orDivider}>
            <span>OR</span>
          </div>

          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            style={styles.input}
            disabled={loading}
            maxLength={6}
          />

          <button
            onClick={handleJoinRoom}
            style={styles.secondaryButton}
            disabled={loading || !playerName.trim() || !roomCode.trim()}
          >
            Join Room
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {loading && <div style={styles.loading}>Connecting...</div>}
        </div>

        <div style={styles.info}>
          <h3>How to Play:</h3>
          <ul style={styles.list}>
            <li>Create a room or join with a code</li>
            <li>Wait for 2 players to join</li>
            <li>First player gets white, second gets black</li>
            <li>Take turns making moves</li>
            <li>Spectators (3+) can watch the game</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center',
    color: '#666',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  divider: {
    marginTop: '8px',
  },
  orDivider: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    fontWeight: '600',
    margin: '8px 0',
  },
  error: {
    padding: '12px',
    background: '#fee',
    color: '#c33',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
  loading: {
    padding: '12px',
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
  info: {
    marginTop: '32px',
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  list: {
    margin: '8px 0 0 20px',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};
