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
  currentPlayer: string | null;
  winner: string | null;
  timeRemaining?: number;
  movesHistory: number[];
}

export enum GameMode {
  CLASSIC = 'Classic',
  SPEED = 'Speed',
  TOURNAMENT = 'Tournament',
  ULTIMATE = 'Ultimate',
  POWER_UP = 'PowerUp'
}

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

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SingleElimination',
  SWISS = 'Swiss',
  ROUND_ROBIN = 'RoundRobin'
}

export enum TournamentStatus {
  REGISTRATION = 'Registration',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed'
}

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

export enum PowerUpType {
  DOUBLE_MOVE = 'DoubleMove',
  BLOCK = 'Block',
  SWAP = 'Swap',
  BOMB = 'Bomb'
}