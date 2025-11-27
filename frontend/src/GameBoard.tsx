import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Socket } from 'socket.io-client';
import { Player, GameState, Color, RoomStatus, GameResult } from './types';

interface GameBoardProps {
  socket: Socket | null;
  roomId: string;
  players: Player[];
  myColor: Color | null;
  gameState: GameState;
  status: RoomStatus;
}

export const GameBoard = ({ socket, roomId, players, myColor, gameState, status }: GameBoardProps) => {
  const [fen, setFen] = useState(gameState.fen);
  const [currentTurn, setCurrentTurn] = useState<Color>(gameState.currentTurn);
  const [playerList, setPlayerList] = useState<Player[]>(players);
  const [gameStatus, setGameStatus] = useState<RoomStatus>(status);
  const [gameResult, setGameResult] = useState<{ result: GameResult; winner: Color | null } | null>(null);
  const [error, setError] = useState('');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>(gameState.lastMove);

  useEffect(() => {
    if (!socket) return;

    // Listen for game updates
    socket.on('game-started', (data: { gameState: GameState; players: Player[] }) => {
      setGameStatus('active');
      setFen(data.gameState.fen);
      setCurrentTurn(data.gameState.currentTurn);
      setPlayerList(data.players);
    });

    socket.on('move-made', (data: { gameState: GameState; playerName: string }) => {
      setFen(data.gameState.fen);
      setCurrentTurn(data.gameState.currentTurn);
      setLastMove(data.gameState.lastMove);
      setError('');
    });

    socket.on('player-joined', (data: { player: Player; players: Player[] }) => {
      setPlayerList(data.players);
    });

    socket.on('player-left', (data: { player: Player; players: Player[]; status: RoomStatus }) => {
      setPlayerList(data.players);
      setGameStatus(data.status);
    });

    socket.on('game-ended', (data: { result: GameResult; winner?: Color; reason?: string }) => {
      setGameStatus('ended');
      setGameResult({ result: data.result, winner: data.winner || null });
    });

    socket.on('invalid-move', (data: { error: string }) => {
      setError(data.error || 'Invalid move');
      setTimeout(() => setError(''), 3000);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('game-started');
      socket.off('move-made');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-ended');
      socket.off('invalid-move');
      socket.off('error');
    };
  }, [socket]);

  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
    if (!socket || gameStatus !== 'active') {
      return false;
    }

    if (!myColor || currentTurn !== myColor) {
      setError("Not your turn");
      setTimeout(() => setError(''), 2000);
      return false;
    }

    // Check for pawn promotion
    const promotion = piece[1]?.toLowerCase() === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')
      ? 'q' // Auto-promote to queen for simplicity
      : undefined;

    socket.emit('make-move', {
      roomId,
      from: sourceSquare,
      to: targetSquare,
      promotion,
    });

    return true;
  };

  const handleResign = () => {
    if (!socket || !myColor) return;

    const confirmed = window.confirm('Are you sure you want to resign?');
    if (confirmed) {
      socket.emit('resign', { roomId });
    }
  };

  const whitePlayer = playerList.find(p => p.color === 'white');
  const blackPlayer = playerList.find(p => p.color === 'black');
  const spectators = playerList.filter(p => p.role === 'spectator');

  const boardOrientation = myColor === 'black' ? 'black' : 'white';

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.roomInfo}>
          <h2 style={styles.roomCode}>Room: {roomId}</h2>
          {gameStatus === 'waiting' && (
            <div style={styles.waiting}>
              <p>Waiting for players...</p>
              <p style={styles.playerCount}>{playerList.filter(p => p.role === 'player').length}/2 players</p>
            </div>
          )}
        </div>

        <div style={styles.players}>
          <div style={styles.playerCard}>
            <h3 style={styles.playerTitle}>
              ⚪ White
              {currentTurn === 'white' && gameStatus === 'active' && (
                <span style={styles.turnBadge}>Active</span>
              )}
            </h3>
            {whitePlayer ? (
              <div style={styles.playerName}>
                {whitePlayer.name}
                {whitePlayer.id === socket?.id && ' (You)'}
              </div>
            ) : (
              <div style={styles.emptySlot}>Waiting for player...</div>
            )}
          </div>

          <div style={styles.playerCard}>
            <h3 style={styles.playerTitle}>
              ⚫ Black
              {currentTurn === 'black' && gameStatus === 'active' && (
                <span style={styles.turnBadge}>Active</span>
              )}
            </h3>
            {blackPlayer ? (
              <div style={styles.playerName}>
                {blackPlayer.name}
                {blackPlayer.id === socket?.id && ' (You)'}
              </div>
            ) : (
              <div style={styles.emptySlot}>Waiting for player...</div>
            )}
          </div>

          {spectators.length > 0 && (
            <div style={styles.playerCard}>
              <h3 style={styles.playerTitle}>👁 Spectators ({spectators.length})</h3>
              {spectators.map(p => (
                <div key={p.id} style={styles.spectatorName}>
                  {p.name} {p.id === socket?.id && '(You)'}
                </div>
              ))}
            </div>
          )}
        </div>

        {gameStatus === 'active' && myColor && (
          <button onClick={handleResign} style={styles.resignButton}>
            Resign
          </button>
        )}
      </div>

      <div style={styles.boardContainer}>
        {gameStatus === 'active' && (
          <div style={styles.turnIndicator}>
            {currentTurn === myColor ? (
              <span style={styles.yourTurn}>🟢 Your turn</span>
            ) : (
              <span style={styles.opponentTurn}>
                ⏳ {currentTurn === 'white' ? whitePlayer?.name || 'White' : blackPlayer?.name || 'Black'}'s turn
              </span>
            )}
          </div>
        )}

        <div style={styles.board}>
          <Chessboard
            position={fen}
            onPieceDrop={handlePieceDrop}
            boardOrientation={boardOrientation}
            areArrowsAllowed={false}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#769656' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          />
        </div>

        {error && (
          <div style={styles.errorToast}>
            ❌ {error}
          </div>
        )}

        {gameResult && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2>Game Over</h2>
              {gameResult.result === 'checkmate' && (
                <p>
                  Checkmate! {gameResult.winner === 'white' ? whitePlayer?.name || 'White' : blackPlayer?.name || 'Black'} wins!
                </p>
              )}
              {gameResult.result === 'stalemate' && <p>Stalemate! Game is a draw.</p>}
              {gameResult.result === 'draw' && <p>Draw!</p>}
              {gameResult.result === 'resignation' && (
                <p>
                  {gameResult.winner
                    ? `${gameResult.winner === 'white' ? whitePlayer?.name || 'White' : blackPlayer?.name || 'Black'} wins by resignation!`
                    : 'Game ended by resignation'}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                style={styles.newGameButton}
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#312e2b',
    padding: '20px',
    gap: '20px',
  },
  sidebar: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  roomInfo: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
  },
  roomCode: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '8px',
  },
  waiting: {
    textAlign: 'center',
    color: '#666',
  },
  playerCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: '8px',
  },
  players: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  playerCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
  },
  playerTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  turnBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    background: '#4caf50',
    color: 'white',
    borderRadius: '4px',
    marginLeft: 'auto',
  },
  playerName: {
    padding: '12px',
    background: '#e3f2fd',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1976d2',
  },
  emptySlot: {
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
  },
  spectatorName: {
    padding: '8px 12px',
    background: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  resignButton: {
    padding: '12px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  boardContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  turnIndicator: {
    marginBottom: '16px',
    fontSize: '18px',
    fontWeight: '600',
  },
  yourTurn: {
    color: '#4caf50',
  },
  opponentTurn: {
    color: '#ff9800',
  },
  board: {
    width: '600px',
    maxWidth: '90vw',
  },
  errorToast: {
    position: 'absolute',
    bottom: '20px',
    background: '#f44336',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  newGameButton: {
    marginTop: '20px',
    padding: '12px 32px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
