// src/hooks/useLineraGame.ts

import { useState, useCallback, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import type { AccountOwner } from "@linera/client";
import { Client, Wallet, Faucet } from "@linera/client";
import { DynamicSigner } from "../lib/dynamic-signer";
import { LINERA_RPC_URL, GAME_APP_ID } from "../constants";
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
  const { primaryWallet } = useDynamicContext();

  // --------------------
  // State
  // --------------------
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<string | null>(null);
  const [lobby, setLobby] = useState<RoomInfo[]>([]);
  const [battleLog, setBattleLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------
  // Init Linera
  // --------------------
  useEffect(() => {
    const init = async () => {
  try {
    setLoading(true);

     const signer = primaryWallet
      ? new DynamicSigner(primaryWallet)
      : new DynamicSigner({} as any);

     const faucet = new Faucet(LINERA_RPC_URL);
     const wallet: Wallet = await faucet.createWallet();

     const owner: AccountOwner = await signer.address();
     await faucet.claimChain(wallet, owner);

     const client = new Client(wallet, signer);
     lineraAdapter.setClient(client, owner, owner); // Don't forget to pass address and chainId

        // 👇 THIS IS THE IMPORTANT PART
        const frontend = (client as any).frontend();
        const app = await frontend.application(GAME_APP_ID);
        lineraAdapter.setApplicationFromApp(app);

        console.log("✅ Linera client + app ready");
      } catch (e: any) {
        console.error(e);
        setError("Linera initialization failed");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [primaryWallet]);

  // --------------------
  // Safe Query
  // --------------------
  const safeQuery = useCallback(
    async <T,>(query: string, onSuccess: (data: T) => void) => {
      if (!lineraAdapter.isReady()) {
        return; // 👈 SILENT WAIT (no error screen)
      }

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

  // --------------------
  // Fetchers
  // --------------------
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

  // --------------------
  // Execute
  // --------------------
  const execute = useCallback(
    async (op: Operation) => {
      if (!lineraAdapter.isReady()) return;

      try {
        const app = lineraAdapter.getApplication();
        await app.query(
          JSON.stringify({ execute: { [op.type]: op.payload } })
        );

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

  // --------------------
  // Public API
  // --------------------
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
    createRoom: (name: string) =>
      execute({ type: "CreateMatch", payload: { name } }),
    fetchLobby,
    fetchBoard,  
     fetchChat,     
     resetGame: () =>
      roomId !== undefined &&
      execute({ type: "JoinGame", payload: { room_id: roomId } }),
  };
};
