import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Trophy, Users, Clock, Zap, Shield, 
  Repeat, Bot, Settings, Volume2, VolumeX
} from 'lucide-react';
import { GameBoard } from '../components/GameBoard';
import { useLineraGame } from '../hooks/useLineraGame';
import { TicTacToeGame } from '../utils/gameLogic';

export const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [gameEngine] = useState(() => new TicTacToeGame());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const { getGameState, address } = useLineraGame();

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const loadGame = async () => {
      const state = await getGameState(parseInt(roomId));
      if (state) {
        // Update game engine with state
        // gameEngine.loadState(state);
      }
    };

    loadGame();
  }, [roomId, navigate]);

  const handleAiMove = () => {
    if (practiceMode && gameEngine.currentPlayer === 'O') {
      const move = gameEngine.getBestMove();
      if (move !== -1) {
        gameEngine.makeMove(move, 'O');
        // Update UI
      }
    }
  };

  useEffect(() => {
    if (practiceMode) {
      handleAiMove();
    }
  }, [practiceMode, gameEngine.currentPlayer]);

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
      {/* Game Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              
              <div>
                <h1 className="text-xl font-bold">Game #{roomId}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Users size={14} />
                    <span>2 Players</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>10s per move</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Trophy size={14} />
                    <span>100 LIN Stake</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <Settings size={20} />
              </button>
              
              <button
                onClick={() => setPracticeMode(!practiceMode)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center space-x-2 ${
                  practiceMode 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                    : 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700'
                }`}
              >
                <Bot size={18} />
                <span>Practice {practiceMode ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gray-800/50 border-b border-gray-700"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold mb-3">Game Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Sound Effects</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(!soundEnabled)}
                      className="toggle"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Vibration</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Animations</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Practice Mode</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-sm">AI Difficulty</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => gameEngine.resetGame()}
                    className="w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <Repeat size={16} />
                    <span>Reset Practice Game</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Power Ups</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Double Move', icon: <Zap size={16} />, cost: 100 },
                    { name: 'Block', icon: <Shield size={16} />, cost: 150 },
                    { name: 'Swap', icon: <Repeat size={16} />, cost: 200 },
                    { name: 'Bomb', icon: <Shield size={16} />, cost: 250 },
                  ].map((powerUp) => (
                    <div
                      key={powerUp.name}
                      className="p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {powerUp.icon}
                        <span className="text-sm font-medium">{powerUp.name}</span>
                      </div>
                      <div className="text-xs text-gray-400">{powerUp.cost} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto">
        <GameBoard roomId={parseInt(roomId)} />
      </div>

      {/* Game Analysis Footer */}
      <div className="border-t border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <Zap size={18} className="text-yellow-400" />
                <span>Best Moves</span>
              </h3>
              <div className="space-y-2">
                {gameEngine.analyzePosition().bestMoves.map((move, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>Position {move.position + 1}</span>
                    <span className="text-cyan-400 font-bold">+{move.score}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <h3 className="font-bold mb-3">Game Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Moves Played</span>
                  <span className="font-bold">{gameEngine.movesHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Player</span>
                  <span className={`font-bold ${gameEngine.currentPlayer === 'X' ? 'text-cyan-400' : 'text-pink-400'}`}>
                    {gameEngine.currentPlayer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Game State</span>
                  <span className={`font-bold ${
                    gameEngine.winner 
                      ? gameEngine.winner === 'T' 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {gameEngine.winner 
                      ? gameEngine.winner === 'T' 
                        ? 'Draw' 
                        : `${gameEngine.winner} Wins!`
                      : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold">
                  Offer Draw
                </button>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-lg font-bold">
                  Resign Game
                </button>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold">
                  Save Replay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};