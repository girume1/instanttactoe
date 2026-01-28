import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { GameState, Player, Room } from '../types';
import { useLineraGame } from '../hooks/useLineraGame';

interface GameContextType {
  currentGame: GameState | null;
  currentRoom: Room | null;
  opponent: Player | null;
  isPlaying: boolean;
  isMyTurn: boolean;
  timeLeft: number;
  joinGame: (roomId: number) => Promise<void>;
  leaveGame: () => void;
  makeMove: (position: number) => Promise<boolean>;
  surrender: () => Promise<void>;
  offerDraw: () => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const { makeMove: lineraMakeMove, getGameState, address } = useLineraGame();

  const joinGame = useCallback(async (roomId: number) => {
    try {
      // In reality, this would fetch game state from blockchain
      const gameState = await getGameState(roomId);
      if (gameState) {
        setCurrentGame(gameState);
        setIsPlaying(true);

        // Check if it's our turn (use snake_case fields from on-chain state)
        const isOurTurn = (gameState as any).current_player === address;
        setIsMyTurn(isOurTurn);

        toast.success('Joined game!');
      }
    } catch (error) {
      toast.error('Failed to join game');
      console.error(error);
    }
  }, [getGameState, address]);

  const leaveGame = useCallback(() => {
    setCurrentGame(null);
    setCurrentRoom(null);
    setOpponent(null);
    setIsPlaying(false);
    setIsMyTurn(false);
    setTimeLeft(30);
    toast('Left the game');
  }, []);

  const makeMove = useCallback(async (position: number): Promise<boolean> => {
    if (!currentRoom || !isMyTurn) {
      toast.error('Not your turn');
      return false;
    }

    try {
      const result = await lineraMakeMove(currentRoom.roomId, position);
      
      if (result) {
        // Update local state optimistically
        if (currentGame) {
          const newBoard = [...currentGame.board];
          newBoard[position] = address ? 'X' : 'O';
          setCurrentGame({
            ...currentGame,
            board: newBoard,
            current_player: address ?? null,
            moves_history: [...(currentGame as any).moves_history, position]
          } as unknown as GameState);

          setIsMyTurn(false);
          setTimeLeft(30);
          return true;
        }
      }
      return false;
    } catch (error) {
      toast.error('Move failed');
      return false;
    }
  }, [currentRoom, isMyTurn, lineraMakeMove, currentGame, address]);

  const surrender = useCallback(async () => {
    if (!currentRoom) return;
    
    try {
      // In reality: await lineraClient.executeOperation({ type: 'Surrender', room_id: currentRoom.roomId })
      toast('You surrendered the game');
      leaveGame();
    } catch (error) {
      toast.error('Surrender failed');
    }
  }, [currentRoom, leaveGame]);

  const offerDraw = useCallback(async () => {
    if (!currentRoom) return;
    
    toast('Draw offer sent to opponent');
    // In reality: await lineraClient.executeOperation({ type: 'OfferDraw', room_id: currentRoom.roomId })
  }, [currentRoom]);

  const resetGame = useCallback(() => {
    if (currentGame) {
      setCurrentGame({
        ...currentGame,
        board: Array(9).fill(null),
        winner: null,
        moves_history: []
      } as unknown as GameState);
      setIsMyTurn(true);
      setTimeLeft(30);
      toast('Game reset');
    }
  }, [currentGame]);

  // Timer effect
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying && isMyTurn && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            toast.error('Time\'s up!');
            // Auto-pass turn here
            setIsMyTurn(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isMyTurn, timeLeft]);

  const value = {
    currentGame,
    currentRoom,
    opponent,
    isPlaying,
    isMyTurn,
    timeLeft,
    joinGame,
    leaveGame,
    makeMove,
    surrender,
    offerDraw,
    resetGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};