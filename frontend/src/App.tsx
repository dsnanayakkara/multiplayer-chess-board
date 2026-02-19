import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuthIdentity } from './auth/useAuthIdentity';
import { LandingPage } from './LandingPage';
import { GameBoard } from './GameBoard';
import type { RoomData, Player, GameState, Color, RoomStatus } from './types';

function App() {
  const { socket, connected } = useSocket();
  const { identity, loading: identityLoading } = useAuthIdentity();
  const [inGame, setInGame] = useState(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for room events
    socket.on('room-created', (data: { roomId: string; players: Player[]; color: Color; gameState: GameState }) => {
      setRoomData({
        roomId: data.roomId,
        players: data.players,
        color: data.color,
        role: 'player',
        gameState: data.gameState,
        status: 'waiting',
      });
    });

    socket.on('room-joined', (data: { roomId: string; players: Player[]; color: Color | null; role: 'player' | 'spectator'; gameState: GameState; status: RoomStatus }) => {
      setRoomData({
        roomId: data.roomId,
        players: data.players,
        color: data.color,
        role: data.role,
        gameState: data.gameState,
        status: data.status,
      });
    });

    socket.on('error', (data: { message: string }) => {
      alert(`Error: ${data.message}`);
      setInGame(false);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('error');
    };
  }, [socket]);

  if (!connected || identityLoading) {
    return (
      <div style={styles.loading}>
        <h2>Connecting to server...</h2>
      </div>
    );
  }

  if (!inGame || !roomData) {
    return (
      <LandingPage
        socket={socket}
        onRoomJoined={() => setInGame(true)}
        defaultPlayerName={identity?.displayName}
      />
    );
  }

  return (
    <GameBoard
      socket={socket}
      roomId={roomData.roomId}
      players={roomData.players}
      myColor={roomData.color}
      gameState={roomData.gameState}
      status={roomData.status}
    />
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
};

export default App;
