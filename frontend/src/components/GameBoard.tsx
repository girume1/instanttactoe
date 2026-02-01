import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, Clock, Trophy, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLineraGame } from '../hooks/useLineraGame';
import { Chat } from './Chat';
import toast from 'react-hot-toast';
import type { GameState } from '../types';
import { GameMode } from '../types';
import { TicTacToeGame } from '../utils/gameLogic';

interface GameBoardProps {
  roomId: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ roomId }) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localBoard, setLocalBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  const { getGameState, makeMove, address, isConnected } = useLineraGame();
  const [gameEngine] = useState(() => new TicTacToeGame());

  useEffect(() => {
    if (!isConnected) {
      toast.error('Connect your wallet first');
      navigate('/');
      return;
    }
    
    loadGameState();
    const interval = setInterval(loadGameState, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [roomId, address, isConnected, navigate]);

  useEffect(() => {
  if (gameState) {
    // Convert snake_case from blockchain to local state
    setLocalBoard(gameState.board.map(cell => cell || null));
    setWinner(gameState.winner);
    
    // Check if it's current player's turn using snake_case
    const isTurn = gameState.current_player === address;
    setIsMyTurn(isTurn);
    
    // Update game engine
    gameEngine.board = [...localBoard];
    gameEngine.currentPlayer = isTurn ? 'X' : 'O';
    gameEngine.winner = winner;
    
    // Reset timer for speed mode
    if (gameState.mode === GameMode.SPEED) {
      setTimeLeft(gameState.time_remaining ?? 30);
    }
  }
}, [gameState, address, localBoard, winner]);
  const loadGameState = async () => {
    try {
      setLoading(true);
      const state = (await getGameState(roomId)) as GameState | null;
      
      if (!state) {
        setError('Game not found or no longer exists');
        return;
      }
      
      setGameState(state);
      setError(null);
      
      // Reset timer for speed mode
      if (state?.mode === 'Speed') {
        setTimeLeft(state.time_remaining ?? 30);
      }
    } catch (error: any) {
      console.error('Failed to load game:', error);
      setError(error.message || 'Failed to load game state');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index: number) => {
    if (!address || !isMyTurn || winner || localBoard[index]) {
      toast.error('Not your turn or invalid move');
      return;
    }

    try {
      // Optimistic update
      const newBoard = [...localBoard];
      const playerSymbol = gameState?.players[0] === address ? 'X' : 'O';
      newBoard[index] = playerSymbol;
      setLocalBoard(newBoard);
      
      // Make move on blockchain
      await makeMove(roomId, index);
      
      toast.success('Move submitted!');
      
      // Refresh game state
      setTimeout(loadGameState, 1000);
    } catch (error: any) {
      // Revert optimistic update
      loadGameState();
      toast.error(error.message || 'Move failed');
    }
  };

  const renderSquare = (index: number) => {
    const cellValue = localBoard[index];
    const isWinningSquare = winner && gameEngine.checkWinner();
    
    return (
      <motion.button
        whileHover={{ scale: cellValue ? 1 : 1.05 }}
        whileTap={{ scale: cellValue ? 1 : 0.95 }}
        onClick={() => handleMove(index)}
        disabled={!!cellValue || !!winner || !isMyTurn || loading}
        className={`
          relative w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 
          flex items-center justify-center text-5xl md:text-6xl font-bold
          transition-all duration-200
          ${isWinningSquare 
            ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-500 shadow-lg shadow-yellow-500/25' 
            : 'bg-gray-800/50 border-gray-700'
          }
          ${!cellValue && isMyTurn && !winner ? 
            'hover:border-cyan-500 hover:bg-gray-700/50 cursor-pointer' : 
            'cursor-not-allowed'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {cellValue === 'X' && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-cyan-400"
            >
              <X size="80%" />
            </motion.div>
          )}
          {cellValue === 'O' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-pink-400"
            >
              <Circle size="80%" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Game</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (loading || !gameState) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Loading game from blockchain...</p>
        </div>
      </div>
    );
  }

  const playerIndex = gameState.players.findIndex(p => p === address);
  const playerSymbol = playerIndex === 0 ? 'X' : 'O';
  // opponentIndex/opponentAddress not used directly; omit to avoid unused-var

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Game Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Room #{roomId} • <span className="text-cyan-400">{gameState.mode || 'Classic'}</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm">
                  Player {playerSymbol} (You) vs Player {playerSymbol === 'X' ? 'O' : 'X'}
                </span>
              </div>
              {gameState.stake && gameState.stake > 0 && (
                <div className="px-3 py-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-full flex items-center space-x-2">
                  <Trophy size={14} className="text-yellow-400" />
                  <span className="font-bold">{gameState.stake} LIN Stake</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Time Left</div>
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-yellow-400" />
                <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400">Turn</div>
              <div className={`text-2xl font-bold ${isMyTurn ? 'text-green-400' : 'text-gray-400'}`}>
                {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
            {/* Winner overlay */}
            <AnimatePresence>
              {winner && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 rounded-2xl flex items-center justify-center z-10"
                >
                  <div className="text-center p-8 bg-gray-900/90 rounded-xl border border-cyan-500/50">
                    <Trophy size={64} className="mx-auto mb-4 text-yellow-400" />
                    <h2 className="text-4xl font-bold mb-2">
                      {winner === 'X' ? '🎉 Player X Wins!' : '🎉 Player O Wins!'}
                    </h2>
                    {winner === playerSymbol && (
                      <p className="text-lg text-green-400">You won!</p>
                    )}
                    {winner !== playerSymbol && winner !== 'T' && (
                      <p className="text-lg text-red-400">You lost</p>
                    )}
                    {winner === 'T' && (
                      <p className="text-lg text-yellow-400">It's a draw!</p>
                    )}
                    {gameState.stake && gameState.stake > 0 && winner !== 'T' && (
                      <p className="text-xl text-yellow-400 font-bold mt-2">
                        Prize: {gameState.stake * 2} LIN
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Board */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-4 md:gap-6 w-fit mx-auto">
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`
                        ${i < 2 ? 'border-r-2 border-gray-700/50' : ''}
                        ${i >= 2 && i < 4 ? 'border-b-2 border-gray-700/50' : ''}
                        ${i >= 4 && i < 6 ? 'border-r-2 border-gray-700/50 border-b-2' : ''}
                        ${i >= 6 ? 'border-b-2 border-gray-700/50' : ''}
                      `}
                    />
                  ))}
                </div>
                
                {/* Squares */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => (
                  <div key={index}>
                    {renderSquare(index)}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg font-bold flex items-center space-x-2"
              >
                <span>Leave Game</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Column - Chat & Stats */}
        <div className="space-y-6">
          {/* Player Stats */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-bold mb-4">Game Info</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Your Symbol</div>
                <div className={`text-2xl font-bold ${playerSymbol === 'X' ? 'text-cyan-400' : 'text-pink-400'}`}>
                  {playerSymbol}
                </div>
              </div>
              
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Moves</div>
                <div className="text-2xl font-bold">
                  {gameState.moves_history.length}
                </div>
              </div>
              
              {gameState.player_stats && (
                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Stats</div>
                  <div className="text-sm">
                    W: {gameState.player_stats[playerIndex]?.[0] || 0} | 
                    L: {gameState.player_stats[playerIndex]?.[1] || 0} | 
                    D: {gameState.player_stats[playerIndex]?.[2] || 0}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Component */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
            <Chat roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
};