// src/hooks/useLineraGame.ts
import { useState, useCallback, useEffect } from "react";
import { lineraAdapter } from "../lib/linera-adapter";

import type {
  Operation,
  BoardResponse,
  LobbyResponse,
  ChatResponse,
  RoomInfo,
  ChatMessage,
  Cell,
} from "../abi/types";

export const useLineraGame = (roomId?: number) => {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<string | null>(null);
  const [lobby, setLobby] = useState<RoomInfo[]>([]);
  const [battleLog, setBattleLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading depends on adapter readiness (AuthWrapper owns connection)
  useEffect(() => {
    const interval = setInterval(() => {
      const ready = lineraAdapter.isReady();
      setLoading(!ready);
      if (ready) setError(null);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const safeQuery = useCallback(
    async <T,>(query: string, onSuccess: (data: T) => void) => {
      if (!lineraAdapter.isReady()) return;

      try {
        const app = lineraAdapter.getApplication();
        const resJson = await app.query(query);
        onSuccess(JSON.parse(resJson));
      } catch (e: any) {
        console.error(e);
        setError("Query failed");
      }
    },
    []
  );

  const fetchLobby = useCallback(() => {
    safeQuery<LobbyResponse>(
      `{ get_lobby { rooms { room_id name creator is_full player_count } } }`,
      (res) => setLobby(res.get_lobby.rooms)
    );
  }, [safeQuery]);

  const fetchBoard = useCallback(() => {
    if (roomId === undefined) return;

    safeQuery<BoardResponse>(
      `{ get_board(room_id: ${roomId}) { board winner } }`,
      (res) => {
        setBoard(res.get_board.board);
        setWinner(res.get_board.winner ?? null);
      }
    );
  }, [roomId, safeQuery]);

  const fetchChat = useCallback(() => {
    if (roomId === undefined) return;

    safeQuery<ChatResponse>(
      `{ get_chat(room_id: ${roomId}) { messages { sender text timestamp } } }`,
      (res) => setBattleLog(res.get_chat.messages)
    );
  }, [roomId, safeQuery]);

  const execute = useCallback(
    async (op: Operation) => {
      if (!lineraAdapter.isReady()) return;

      try {
        const app = lineraAdapter.getApplication();
        await app.query(JSON.stringify({ execute: { [op.type]: op.payload } }));

        fetchLobby();
        fetchBoard();
        fetchChat();
      } catch (e: any) {
        console.error(e);
        setError("Operation failed");
      }
    },
    [fetchLobby, fetchBoard, fetchChat]
  );

  return {
    board,
    winner,
    lobby,
    battleLog,
    loading,
    error,
    makeMove: (pos: number) =>
      roomId !== undefined &&
      execute({ type: "MakeMove", payload: { room_id: roomId, position: pos } }),
    createRoom: (name: string) => execute({ type: "CreateMatch", payload: { name } }),
    fetchLobby,
    fetchBoard,
    fetchChat,
    resetGame: () =>
      roomId !== undefined && execute({ type: "JoinGame", payload: { room_id: roomId } }),
  };
};
