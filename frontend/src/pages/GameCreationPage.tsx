import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Lock, Users, Zap, Trophy } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import toast from 'react-hot-toast';

export const GameCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    mode: 'Classic',
    stake: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { createRoom, address, isConnected } = useLineraGame();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (formData.stake && (isNaN(Number(formData.stake)) || Number(formData.stake) < 0)) {
      toast.error('Invalid stake amount');
      return;
    }

    try {
      setLoading(true);
      const stakeAmount = formData.stake ? parseInt(formData.stake) : undefined;
      
      const result = await createRoom(
        formData.name.trim(),
        formData.password.trim() || undefined,
        formData.mode,
        stakeAmount
      );
      
      if (result && (result.room_id || result.id)) {
        const roomId = result.room_id || result.id;
        toast.success('Room created successfully!');
        navigate(`/game/${roomId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-8">Please connect your wallet to create a game</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create New Game</h1>
          <p className="text-gray-400">Start a new Tic-Tac-Toe match on the blockchain</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Room Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Championship Match"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password (Optional)</label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="Leave empty for public game"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Game Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'Classic', icon: <Users size={20} />, label: 'Classic', desc: 'Normal gameplay' },
                { value: 'Speed', icon: <Zap size={20} />, label: 'Speed', desc: '10s per move' },
                { value: 'PowerUp', icon: <Trophy size={20} />, label: 'Power Up', desc: 'Special abilities' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setFormData({...formData, mode: mode.value})}
                  className={`p-4 rounded-lg border transition-all ${
                    formData.mode === mode.value
                      ? 'border-cyan-500 bg-cyan-900/20'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }`}
                  disabled={loading}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2">{mode.icon}</div>
                    <div className="font-bold">{mode.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Stake Amount (Optional)</label>
            <input
              type="number"
              min="0"
              value={formData.stake}
              onChange={(e) => setFormData({...formData, stake: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="0 for friendly match"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-2">
              The stake amount will be deducted from your balance and awarded to the winner
            </p>
          </div>
          
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/game/lobby')}
              className="flex-1 px-6 py-3 border border-gray-700 rounded-lg font-bold hover:bg-gray-800/50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};