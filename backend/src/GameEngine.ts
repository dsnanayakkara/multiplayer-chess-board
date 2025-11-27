import { Chess } from 'chess.js';
import { Color, GameState, GameResult } from './types';

export class GameEngine {
  private games: Map<string, Chess> = new Map();

  /**
   * Initialize a new game for a room
   */
  initGame(roomId: string): void {
    const chess = new Chess();
    this.games.set(roomId, chess);
    console.log(`Game initialized for room ${roomId}`);
  }

  /**
   * Get chess instance for a room
   */
  private getGame(roomId: string): Chess {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  }

  /**
   * Get current game state
   */
  getGameState(roomId: string): GameState {
    const game = this.getGame(roomId);

    return {
      fen: game.fen(),
      currentTurn: game.turn() === 'w' ? 'white' : 'black',
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial(),
    };
  }

  /**
   * Validate and make a move
   */
  makeMove(
    roomId: string,
    from: string,
    to: string,
    promotion?: string
  ): { success: boolean; gameState?: GameState; error?: string; result?: GameResult } {
    try {
      const game = this.getGame(roomId);

      // Attempt the move
      const move = game.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });

      if (!move) {
        return {
          success: false,
          error: 'Invalid move',
        };
      }

      const gameState = this.getGameState(roomId);

      // Check for game end conditions
      let result: GameResult | undefined;
      if (gameState.isCheckmate) {
        result = 'checkmate';
      } else if (gameState.isDraw) {
        if (game.isStalemate()) {
          result = 'stalemate';
        } else {
          result = 'draw';
        }
      }

      return {
        success: true,
        gameState: {
          ...gameState,
          lastMove: { from, to },
        },
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate if a player can make a move
   */
  validateTurn(roomId: string, color: Color): boolean {
    const game = this.getGame(roomId);
    const currentTurn = game.turn() === 'w' ? 'white' : 'black';
    return currentTurn === color;
  }

  /**
   * Get game result for resignation
   */
  resign(roomId: string, color: Color): { winner: Color; result: GameResult } {
    return {
      winner: color === 'white' ? 'black' : 'white',
      result: 'resignation',
    };
  }

  /**
   * Clean up a game
   */
  deleteGame(roomId: string): void {
    this.games.delete(roomId);
    console.log(`Game deleted for room ${roomId}`);
  }
}
