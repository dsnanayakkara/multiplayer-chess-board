export type Color = 'white' | 'black';
export type PlayerRole = 'player' | 'spectator';
export type RoomStatus = 'waiting' | 'active' | 'ended';
export type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'resignation';

export interface Player {
  id: string;
  name: string;
  color: Color | null;
  role: PlayerRole;
}

export interface GameState {
  fen: string;
  currentTurn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  lastMove?: { from: string; to: string };
}

export interface RoomData {
  roomId: string;
  players: Player[];
  color: Color | null;
  role?: PlayerRole;
  gameState: GameState;
  status: RoomStatus;
}
