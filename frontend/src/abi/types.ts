// src/abi/types.ts
// Only your ABI types — do NOT redefine Client/Wallet/AccountOwner

import type { AccountOwner } from '@linera/client';

/* -----------------------------
   Chat Messages
----------------------------- */
export interface ChatMessage {
  sender: AccountOwner;
  text: string;
  timestamp: number;
}

/* -----------------------------
   Game Board
----------------------------- */
export type Cell = null | 'X' | 'O';

export interface GameBoard {
  board: [
    Cell, Cell, Cell,
    Cell, Cell, Cell,
    Cell, Cell, Cell
  ];
  winner: null | 'X' | 'O' | 'Tie';
  current_player: 'X' | 'O';
}

/* -----------------------------
   Rooms / Lobby
----------------------------- */
export interface RoomInfo {
  room_id: number;
  name: string;
  creator: AccountOwner;
  is_full: boolean;
  player_count: number;
}

/* -----------------------------
   Operations (writes)
----------------------------- */
export type Operation =
  | { type: 'CreateMatch'; payload: { name: string } }
  | { type: 'JoinGame'; payload: { room_id: number } }
  | { type: 'MakeMove'; payload: { room_id: number; position: number } }
  | { type: 'PostMessage'; payload: { room_id: number; text: string } };

/* -----------------------------
   GraphQL-shaped responses
----------------------------- */
export interface LobbyResponse {
  get_lobby: {
    rooms: RoomInfo[];
  };
}

export interface BoardResponse {
  get_board: {
    board: [
      Cell, Cell, Cell,
      Cell, Cell, Cell,
      Cell, Cell, Cell
    ];
    winner: null | 'X' | 'O' | 'Tie';
    current_player: 'X' | 'O';
  };
}

export interface ChatResponse {
  get_chat: {
    messages: ChatMessage[];
  };
}

/* -----------------------------
   Full game state helper
----------------------------- */
export interface FullGameState {
  board: GameBoard;
  chat: ChatMessage[];
}
