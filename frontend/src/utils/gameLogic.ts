import { GameMode, PowerUpType } from '../types';

interface TournamentBracket {
  matches: Array<{
    id: number;
    player1?: string;
    player2?: string;
    round: number;
    nextMatchId?: number;
  }>;
  rounds: number;
}

export class TicTacToeGame {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  movesHistory: number[];
  gameMode: GameMode;
  timeLimit?: number;
  powerUps: Map<string, { type: PowerUpType; uses: number }>;

  constructor(mode: GameMode = GameMode.CLASSIC) {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.movesHistory = [];
    this.gameMode = mode;
    this.powerUps = new Map();
    
    if (mode === 'Speed') {
      this.timeLimit = 10; // 10 seconds per move
    }
  }

  makeMove(position: number, player: 'X' | 'O'): boolean {
    if (this.winner || this.board[position] || player !== this.currentPlayer) {
      return false;
    }

    this.board[position] = player;
    this.movesHistory.push(position);
    
    if (this.checkWinner()) {
      this.winner = player;
    } else if (this.isBoardFull()) {
      this.winner = 'T'; // Tie
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }
    
    return true;
  }

  checkWinner(): boolean {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return true;
      }
    }
    
    return false;
  }

  isBoardFull(): boolean {
    return this.board.every(cell => cell !== null);
  }

  getBoardState(): string {
    return this.board.map(cell => cell || ' ').join('');
  }

  undoLastMove(): boolean {
    if (this.movesHistory.length === 0 || this.winner) {
      return false;
    }
    
    const lastMove = this.movesHistory.pop()!;
    this.board[lastMove] = null;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.winner = null;
    
    return true;
  }

  resetGame(): void {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.movesHistory = [];
  }

  // Power-up methods
  usePowerUp(powerUpType: PowerUpType, player: 'X' | 'O'): boolean {
    if (player !== this.currentPlayer) {
      return false;
    }

    const powerUpKey = `${player}_${powerUpType}`;
    const powerUp = this.powerUps.get(powerUpKey);
    
    if (!powerUp || powerUp.uses <= 0) {
      return false;
    }

    switch (powerUpType) {
      case PowerUpType.DOUBLE_MOVE:
        // Player gets another move
        this.powerUps.set(powerUpKey, { ...powerUp, uses: powerUp.uses - 1 });
        return true;
        
      case PowerUpType.BLOCK:
        // Block opponent's next move
        this.powerUps.set(powerUpKey, { ...powerUp, uses: powerUp.uses - 1 });
        return true;
        
      case PowerUpType.SWAP:
        // Swap positions with opponent
        if (this.movesHistory.length >= 2) {
          const lastMove = this.movesHistory[this.movesHistory.length - 1];
          const secondLastMove = this.movesHistory[this.movesHistory.length - 2];
          [this.board[lastMove], this.board[secondLastMove]] = 
            [this.board[secondLastMove], this.board[lastMove]];
          this.powerUps.set(powerUpKey, { ...powerUp, uses: powerUp.uses - 1 });
          return true;
        }
        return false;
        
      case PowerUpType.BOMB:
        // Clear a 3x3 area
        const center = this.findBestBombPosition();
        if (center !== -1) {
          const positions = this.getAdjacentPositions(center);
          positions.forEach(pos => {
            if (this.board[pos] && this.board[pos] !== player) {
              this.board[pos] = null;
            }
          });
          this.powerUps.set(powerUpKey, { ...powerUp, uses: powerUp.uses - 1 });
          return true;
        }
        return false;
    }
    
    return false;
  }

  private findBestBombPosition(): number {
    // Find position with most opponent pieces in 3x3 area
    let bestPos = -1;
    let maxOpponentCount = 0;
    
    for (let i = 0; i < 9; i++) {
      const positions = this.getAdjacentPositions(i);
      const opponentCount = positions.filter(pos => 
        this.board[pos] && this.board[pos] !== this.currentPlayer
      ).length;
      
      if (opponentCount > maxOpponentCount) {
        maxOpponentCount = opponentCount;
        bestPos = i;
      }
    }
    
    return bestPos;
  }

  private getAdjacentPositions(center: number): number[] {
    const positions = [center];
    const row = Math.floor(center / 3);
    const col = center % 3;
    
    // Get all positions in 3x3 grid around center
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
          const pos = newRow * 3 + newCol;
          if (pos !== center) {
            positions.push(pos);
          }
        }
      }
    }
    
    return positions;
  }

  // AI opponent (for practice mode)
  getBestMove(): number {
    // Simple AI: prioritize winning, then blocking, then center, then corners, then edges
    const player = this.currentPlayer;
    const opponent = player === 'X' ? 'O' : 'X';
    
    // 1. Check for winning move
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = player;
        if (this.checkWinner()) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }
    
    // 2. Check for blocking move
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = opponent;
        if (this.checkWinner()) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }
    
    // 3. Take center if available
    if (!this.board[4]) return 4;
    
    // 4. Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !this.board[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // 5. Take edges
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => !this.board[i]);
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    // 6. Any available move (shouldn't reach here if board not full)
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) return i;
    }
    
    return -1;
  }

  // Game analysis
  analyzePosition(): {
    bestMoves: { position: number; score: number }[];
    threats: number[];
    evaluation: 'winning' | 'losing' | 'equal' | 'unknown';
  } {
    const scores: { position: number; score: number }[] = [];
    const threats: number[] = [];
    
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        // Simulate move and evaluate
        this.board[i] = this.currentPlayer;
        const score = this.evaluatePosition();
        this.board[i] = null;
        
        scores.push({ position: i, score });
        
        // Check if this move creates a winning threat
        this.board[i] = this.currentPlayer;
        const hasWinningThreat = this.checkWinner();
        this.board[i] = null;
        
        if (hasWinningThreat) {
          threats.push(i);
        }
      }
    }
    
    scores.sort((a, b) => b.score - a.score);
    
    let evaluation: 'winning' | 'losing' | 'equal' | 'unknown' = 'unknown';
    if (scores.length > 0) {
      const bestScore = scores[0].score;
      if (bestScore > 100) evaluation = 'winning';
      else if (bestScore < -100) evaluation = 'losing';
      else if (bestScore === 0) evaluation = 'equal';
    }
    
    return { bestMoves: scores.slice(0, 3), threats, evaluation };
  }

  private evaluatePosition(): number {
    // Simple evaluation function
    if (this.checkWinner()) {
      return this.winner === this.currentPlayer ? 1000 : -1000;
    }
    
    if (this.isBoardFull()) {
      return 0;
    }
    
    // Count potential winning lines
    let score = 0;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (const [a, b, c] of lines) {
      const line = [this.board[a], this.board[b], this.board[c]];
      const playerCount = line.filter(cell => cell === this.currentPlayer).length;
      const opponentCount = line.filter(cell => cell && cell !== this.currentPlayer).length;
      // const emptyCount = 3 - playerCount - opponentCount; // not used
      if (opponentCount === 0) {
        // Line controlled by player
        score += Math.pow(10, playerCount);
      } else if (playerCount === 0) {
        // Line controlled by opponent
        score -= Math.pow(10, opponentCount);
      }
    }
    
    return score;
  }

  // Tournament utilities
  generateSwissPairings(players: string[], _round: number): [string, string][] {
    // Simple Swiss pairing algorithm
    const pairings: [string, string][] = [];
    const sortedPlayers = [...players].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < sortedPlayers.length; i += 2) {
      if (i + 1 < sortedPlayers.length) {
        pairings.push([sortedPlayers[i], sortedPlayers[i + 1]]);
      }
    }
    
    return pairings;
  }

  generateEliminationBracket(players: string[]): TournamentBracket {
    const bracket: TournamentBracket = {
      matches: [],
      rounds: Math.ceil(Math.log2(players.length))
    };
    
    // Create first round matches
    let matchId = 1;
    for (let i = 0; i < players.length; i += 2) {
      bracket.matches.push({
        id: matchId++,
        player1: players[i],
        player2: i + 1 < players.length ? players[i + 1] : undefined,
        round: 1,
        nextMatchId: Math.ceil(matchId / 2)
      });
    }
    
    // Create subsequent rounds
    let currentRound = 2;
    let matchesInRound = Math.ceil(players.length / 4);
    
    while (currentRound <= bracket.rounds) {
      for (let i = 0; i < matchesInRound; i++) {
        bracket.matches.push({
          id: matchId++,
          round: currentRound,
          nextMatchId: currentRound < bracket.rounds ? Math.ceil(matchId / 2) : undefined
        });
      }
      
      matchesInRound = Math.ceil(matchesInRound / 2);
      currentRound++;
    }
    
    return bracket;
  }
}

// Utility functions
export const calculateElo = (
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'loss' | 'draw',
  kFactor: number = 32
): number => {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
  
  return Math.round(playerElo + kFactor * (actual - expected));
};

export const formatGameTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const validateRoomName = (name: string): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Room name is required' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Room name too long (max 50 chars)' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Room name too short (min 3 chars)' };
  }
  return { valid: true };
};

export const validatePassword = (password?: string): { valid: boolean; error?: string } => {
  if (password && password.length > 20) {
    return { valid: false, error: 'Password too long (max 20 chars)' };
  }
  return { valid: true };
};

export const calculatePrizeDistribution = (
  prizePool: number,
  distribution: number[]
): number[] => {
  const total = distribution.reduce((sum, percent) => sum + percent, 0);
  if (total !== 100) {
    // Normalize to 100%
    const scale = 100 / total;
    distribution = distribution.map(p => Math.round(p * scale));
  }
  
  return distribution.map(percent => Math.round((prizePool * percent) / 100));
};