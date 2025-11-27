export type Color = 'white' | 'black';
export type PlayerRole = 'player' | 'spectator';
export type RoomStatus = 'waiting' | 'active' | 'ended';
export type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'resignation';

export interface Player {
  id: string;           // socket.id
  name: string;         // display name
  color: Color | null;  // assigned color (white or black)
  role: PlayerRole;     // player or spectator
}

export interface Room {
  id: string;
  players: Player[];
  status: RoomStatus;
  createdAt: number;
}

export interface MoveRequest {
  roomId: string;
  from: string;
  to: string;
  promotion?: string;
}

export interface GameState {
  fen: string;
  currentTurn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  lastMove?: { from: string; to: string };
}
