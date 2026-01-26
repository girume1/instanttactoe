import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, Award, Zap, Crown, TrendingUp, Calendar, ChevronRight, Star } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import { lineraAdapter } from '../utils/linera-adapter';
import { Tournament } from '../types';
import toast from 'react-hot-toast';

export const TournamentComponent: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live' | 'completed'>('upcoming');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { createTournament, joinTournament, address, isConnected } = useLineraGame();

  useEffect(() => {
    if (isConnected) {
      loadTournaments();
    }
  }, [isConnected]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await lineraAdapter.queryApplication({
        type: 'GetTournaments',
        status: activeTab === 'upcoming' ? 'Registration' : 
                activeTab === 'live' ? 'InProgress' : 'Completed'
      });
      
      if (Array.isArray(response)) {
        const transformedTournaments: Tournament[] = response.map((t: any) => ({
          id: t.id || 0,
          name: t.name || 'Unnamed Tournament',
          format: t.format || 'SingleElimination',
          status: t.status || 'Registration',
          entryFee: t.entry_fee || undefined,
          prizePool: t.prize_pool || 0,
          players: t.players || [],
          maxPlayers: t.max_players || 32,
          currentRound: t.current_round || 0
        }));
        
        setTournaments(transformedTournaments);
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (formData: any) => {
    if (!address) {
      toast.error('Connect wallet first');
      return;
    }

    try {
      await createTournament(
        formData.name,
        formData.format,
        formData.entryFee ? parseInt(formData.entryFee) : undefined,
        parseInt(formData.maxPlayers)
      );
      
      setIsCreating(false);
      toast.success('Tournament created!');
      loadTournaments(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tournament');
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    if (!address) {
      toast.error('Connect wallet first');
      return;
    }

    try {
      await joinTournament(tournamentId);
      toast.success('Joined tournament!');
      loadTournaments(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to join tournament');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registration': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800/30';
      case 'InProgress': return 'text-green-400 bg-green-900/30 border-green-800/30';
      case 'Completed': return 'text-gray-400 bg-gray-900/30 border-gray-800/30';
      default: return 'text-gray-400';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'SingleElimination': return <Trophy size={16} className="text-red-400" />;
      case 'Swiss': return <TrendingUp size={16} className="text-blue-400" />;
      case 'RoundRobin': return <Users size={16} className="text-green-400" />;
      default: return <Trophy size={16} />;
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400 mb-6">Please connect your wallet to view tournaments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
        <p className="text-gray-400">Real blockchain tournaments with prizes</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8">
        {(['upcoming', 'live', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              loadTournaments();
            }}
            className={`px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                : 'bg-gray-800/50 hover:bg-gray-800'
            }`}
            disabled={loading}
          >
            {tab === 'upcoming' && <Calendar size={20} />}
            {tab === 'live' && <Zap size={20} />}
            {tab === 'completed' && <Award size={20} />}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
        
        <button
          onClick={() => setIsCreating(true)}
          disabled={loading}
          className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold flex items-center space-x-2 disabled:opacity-50"
        >
          <Trophy size={20} />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Loading tournaments from blockchain...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-bold mb-2">No tournaments found</h3>
          <p className="text-gray-400 mb-6">Be the first to create a tournament!</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
          >
            Create Tournament
          </button>
        </div>
      ) : (
        /* Tournaments Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{tournament.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center space-x-1">
                      {getFormatIcon(tournament.format)}
                      <span>{tournament.format.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Users size={14} />
                      <span>{tournament.players.length}/{tournament.maxPlayers}</span>
                    </span>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Entry Fee</div>
                  <div className="text-xl font-bold">
                    {tournament.entryFee ? `${tournament.entryFee} LIN` : 'FREE'}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Prize Pool</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {tournament.prizePool.toLocaleString()} LIN
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Registration Progress</span>
                  <span>{Math.round((tournament.players.length / tournament.maxPlayers) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(tournament.players.length / tournament.maxPlayers) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {tournament.players.slice(0, 5).map((player, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs"
                      title={player}
                    >
                      {player.slice(2, 4)}
                    </div>
                  ))}
                  {tournament.players.length > 5 && (
                    <div className="w-8 h-8 bg-gray-800 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs">
                      +{tournament.players.length - 5}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleJoinTournament(tournament.id)}
                  disabled={tournament.status !== 'Registration' || tournament.players.length >= tournament.maxPlayers}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tournament.status === 'Registration' ? 'Join Now' : 'View Details'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {isCreating && (
          <CreateTournamentModal
            onClose={() => setIsCreating(false)}
            onCreate={handleCreateTournament}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateTournamentModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    format: 'SingleElimination',
    entryFee: '',
    maxPlayers: '32',
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Tournament name is required');
      return;
    }

    if (formData.entryFee && (isNaN(Number(formData.entryFee)) || Number(formData.entryFee) < 0)) {
      toast.error('Invalid entry fee');
      return;
    }

    onCreate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tournament Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Weekly Championship"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({...formData, format: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="SingleElimination">Single Elimination</option>
              <option value="Swiss">Swiss System</option>
              <option value="RoundRobin">Round Robin</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Entry Fee (LIN)</label>
              <input
                type="number"
                min="0"
                value={formData.entryFee}
                onChange={(e) => setFormData({...formData, entryFee: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="0 for free entry"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Max Players</label>
              <select
                value={formData.maxPlayers}
                onChange={(e) => setFormData({...formData, maxPlayers: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="8">8 Players</option>
                <option value="16">16 Players</option>
                <option value="32">32 Players</option>
                <option value="64">64 Players</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>Prizes are automatically distributed:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>1st place: 50% of prize pool</li>
              <li>2nd place: 30% of prize pool</li>
              <li>3rd place: 20% of prize pool</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-700 rounded-lg font-medium hover:bg-gray-800/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
          >
            Create Tournament
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};