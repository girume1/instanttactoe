export interface Player {
  address: string;
  nickname: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
}

export interface Room {
  roomId: number;
  name: string;
  creator: string;
  isFull: boolean;
  hasPassword: boolean;
  playerCount: number;
  mode: GameMode;
  stake?: number;
}

export interface GameState {
  board: (string | null)[];
  players: (string | null)[];
  current_player: string | null;
  winner: string | null;
  time_remaining?: number;
  player_stats: [number, number, number][];
  moves_history: number[];
  player_nicknames?: Record<string, string>;
  mode?: string;
  stake?: number;
}

export interface Operation {
  type: string;
  [key: string]: any;
}

export const GameMode = {
  CLASSIC: 'Classic',
  SPEED: 'Speed',
  TOURNAMENT: 'Tournament',
  ULTIMATE: 'Ultimate',
  POWER_UP: 'PowerUp'
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export interface Tournament {
  id: number;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  entryFee?: number;
  prizePool: number;
  players: string[];
  maxPlayers: number;
  currentRound: number;
}

export interface TournamentBracket {
  matches: TournamentMatch[];
  rounds: number;
}

export interface TournamentMatch {
  id: number;
  player1?: string;
  player2?: string;
  winner?: string;
  round: number;
  nextMatchId?: number;
}


export const TournamentFormat = {
  SINGLE_ELIMINATION: 'SingleElimination',
  SWISS: 'Swiss',
  ROUND_ROBIN: 'RoundRobin'
} as const;
export type TournamentFormat = (typeof TournamentFormat)[keyof typeof TournamentFormat];

export const TournamentStatus = {
  REGISTRATION: 'Registration',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed'
} as const;
export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];

export interface Guild {
  id: number;
  name: string;
  tag: string;
  level: number;
  members: number;
  treasury: number;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const PowerUpType = {
  DOUBLE_MOVE: 'DoubleMove',
  BLOCK: 'Block',
  SWAP: 'Swap',
  BOMB: 'Bomb'
} as const;
export type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType];

export interface RoomDetail extends Room {
  players: string[];
  mode: GameMode;
  stake?: number;
  created_at: number;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  streak: number;
}

export interface MatchResult {
  winner: string | null;
  isDraw: boolean;
  prize?: number;
}