import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, Zap, Shield, Repeat, Bomb, Clock, Trophy, Users } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import { Chat } from './Chat';
import toast from 'react-hot-toast';
import { Howl } from 'howler';

// Sound manager class
class SoundManager {
  private moveSound: Howl;
  private winSound: Howl;
  private loseSound: Howl;
  private drawSound: Howl;
  
  constructor() {
    this.moveSound = new Howl({
      src: ['/assets/sounds/move.mp3'],
      volume: 0.3,
      preload: true
    });
    
    this.winSound = new Howl({
      src: ['/assets/sounds/win.mp3'],
      volume: 0.4,
      preload: true
    });
    
    this.loseSound = new Howl({
      src: ['/assets/sounds/lose.mp3'],
      volume: 0.4,
      preload: true
    });
    
    this.drawSound = new Howl({
      src: ['/assets/sounds/draw.mp3'],
      volume: 0.4,
      preload: true
    });
  }
  
  playMove() {
    this.moveSound.play();
  }
  
  playWin() {
    this.winSound.play();
  }
  
  playLose() {
    this.loseSound.play();
  }
  
  playDraw() {
    this.drawSound.play();
  }
  
  setVolume(volume: number) {
    [this.moveSound, this.winSound, this.loseSound, this.drawSound].forEach(sound => {
      sound.volume(volume);
    });
  }
  
  mute() {
    [this.moveSound, this.winSound, this.loseSound, this.drawSound].forEach(sound => {
      sound.mute(true);
    });
  }
  
  unmute() {
    [this.moveSound, this.winSound, this.loseSound, this.drawSound].forEach(sound => {
      sound.mute(false);
    });
  }
}


interface GameBoardProps {
  roomId: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ roomId }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [stake, setStake] = useState<number>(0);
  const [playerNicknames, setPlayerNicknames] = useState<Record<string, string>>({});
  const [selectedPowerUp, setSelectedPowerUp] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<string>('Classic');
  const [soundManager] = useState(() => new SoundManager());
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { makeMove, getGameState, address } = useLineraGame();

  const powerUps = [
    { id: 'double', name: 'Double Move', icon: <Zap size={20} />, cost: 100 },
    { id: 'block', name: 'Block', icon: <Shield size={20} />, cost: 150 },
    { id: 'swap', name: 'Swap', icon: <Repeat size={20} />, cost: 200 },
    { id: 'bomb', name: 'Bomb', icon: <Bomb size={20} />, cost: 250 },
  ];

  useEffect(() => {
    const loadGameState = async () => {
      const state = await getGameState(roomId);
      if (state) {
        setBoard(state.board.map((cell: string) => cell || null));
        setCurrentPlayer(state.current_player === address ? 'X' : 'O');
        setWinner(state.winner);
        setStake(state.stake || 0);
        setGameMode(state.mode || 'Classic');
        setPlayerNicknames(state.player_nicknames || {});
      }
    };

    loadGameState();
    const interval = setInterval(loadGameState, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [roomId, address]);

  useEffect(() => {
    if (gameMode === 'Speed') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            toast.error('Time\'s up! Turn skipped');
            // Auto-pass turn here
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameMode]);

  const handleMove = async (index: number) => {
    if (board[index] || winner || !address) {
      toast.error('Invalid move');
      return;
    }

    try {
      await makeMove(roomId, index);

      if (soundEnabled) soundManager.playMove();
      
      // Optimistic update
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      
      // Check for winner
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      for (const [a, b, c] of lines) {
        if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
          setWinner(newBoard[a]);
          // Play win/lose sound
          if (soundEnabled) {
            if (newBoard[a] === currentPlayer) {
              soundManager.playWin();
            } else {
              soundManager.playLose();
            }
          }
          toast.success(`${newBoard[a]} wins! 🎉`);
          break;
        }
      }

      // Check for draw
      if (newBoard.every(cell => cell !== null) && !winner) {
        if (soundEnabled) soundManager.playDraw();
        toast.info("It's a draw! 🤝");
      }

      // Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      setTimeLeft(30);
      
    } catch (error) {
      toast.error('Move failed');
    }
  };

  const usePowerUp = (powerUpId: string) => {
    if (selectedPowerUp === powerUpId) {
      setSelectedPowerUp(null);
    } else {
      setSelectedPowerUp(powerUpId);
      toast(`Power Up: ${powerUps.find(p => p.id === powerUpId)?.name} activated!`);
    }
  };

  const renderSquare = (index: number) => {
    const isWinningSquare = winner && board[index] === winner;
    
    return (
      <motion.button
        whileHover={{ scale: board[index] ? 1 : 1.05 }}
        whileTap={{ scale: board[index] ? 1 : 0.95 }}
        onClick={() => handleMove(index)}
        disabled={!!board[index] || !!winner}
        className={`
          relative w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 
          flex items-center justify-center text-5xl md:text-6xl font-bold
          transition-all duration-200
          ${isWinningSquare 
            ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-500 shadow-lg shadow-yellow-500/25' 
            : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500 hover:bg-gray-700/50'
          }
          ${board[index] ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <AnimatePresence mode="wait">
          {board[index] === 'X' && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-cyan-400"
            >
              <X size="80%" />
            </motion.div>
          )}
          {board[index] === 'O' && (
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
        
        {/* Move number indicator */}
        {!board[index] && (
          <span className="absolute bottom-1 right-2 text-xs text-gray-500">
            {index + 1}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Game Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Room #{roomId} • <span className="text-cyan-400">{gameMode}</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm">
                  {playerNicknames.player_x || 'Player X'} vs {playerNicknames.player_o || 'Player O'}
                </span>
              </div>
              {stake > 0 && (
                <div className="px-3 py-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-full flex items-center space-x-2">
                  <Trophy size={14} className="text-yellow-400" />
                  <span className="font-bold">{stake} LIN Stake</span>
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
              <div className={`text-2xl font-bold ${currentPlayer === 'X' ? 'text-cyan-400' : 'text-pink-400'}`}>
                {currentPlayer}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
            {/* Power Ups */}
            {gameMode === 'PowerUp' && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
                  <Zap size={20} className="text-yellow-400" />
                  <span>Power Ups</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {powerUps.map(powerUp => (
                    <motion.button
                      key={powerUp.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => usePowerUp(powerUp.id)}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 border ${
                        selectedPowerUp === powerUp.id
                          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500'
                      }`}
                    >
                      {powerUp.icon}
                      <span>{powerUp.name}</span>
                      <span className="text-xs text-gray-400">{powerUp.cost} pts</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Game Board Grid */}
            <div className="relative">
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
                      {stake > 0 && (
                        <p className="text-xl text-yellow-400 font-bold">
                          Prize: {stake * 2} LIN
                        </p>
                      )}
                      <p className="text-gray-400 mt-4">Game Over</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Board */}
              <div className="grid grid-cols-3 gap-4 md:gap-6 w-fit mx-auto relative">
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
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold flex items-center space-x-2"
              >
                <Repeat size={20} />
                <span>Rematch</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg font-bold flex items-center space-x-2"
              >
                <Shield size={20} />
                <span>Surrender</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold flex items-center space-x-2"
              >
                <Zap size={20} />
                <span>Speed Up (5 LIN)</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Column - Chat & Stats */}
        <div className="space-y-6">
          {/* Player Stats */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-bold mb-4">Player Stats</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="font-bold">X</span>
                  </div>
                  <div>
                    <div className="font-bold">{playerNicknames.player_x || 'Player X'}</div>
                    <div className="text-sm text-gray-400">ELO: 1542</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">62%</div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="font-bold">O</span>
                  </div>
                  <div>
                    <div className="font-bold">{playerNicknames.player_o || 'Player O'}</div>
                    <div className="text-sm text-gray-400">ELO: 1489</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pink-400">58%</div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </div>
            </div>
            
            {/* Move History */}
            <div className="mt-6">
              <h4 className="font-bold mb-2 text-gray-300">Move History</h4>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((move) => (
                  <div key={move} className="w-8 h-8 bg-gray-800/50 rounded flex items-center justify-center text-sm">
                    {move}
                  </div>
                ))}
              </div>
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