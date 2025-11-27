export type Team = 'white' | 'black';
export type PlayerRole = 'player' | 'spectator';
export type RoomStatus = 'waiting' | 'active' | 'ended';
export type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'resignation';

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  role: PlayerRole;
}

export interface GameState {
  fen: string;
  currentTurn: Team;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  lastMove?: { from: string; to: string };
}

export interface RoomData {
  roomId: string;
  players: Player[];
  team: Team | null;
  role?: PlayerRole;
  gameState: GameState;
  status: RoomStatus;
}
