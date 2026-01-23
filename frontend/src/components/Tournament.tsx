import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Users, Clock, Award, Zap, Crown, 
  TrendingUp, Lock, Calendar, ChevronRight, Star, Target
} from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import toast from 'react-hot-toast';

interface Tournament {
  id: number;
  name: string;
  format: string;
  status: string;
  entryFee?: number;
  prizePool: number;
  players: string[];
  maxPlayers: number;
  currentRound: number;
}

export const TournamentComponent: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live' | 'completed'>('upcoming');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { createTournament, joinTournament, address } = useLineraGame();

  // Mock data - in reality from blockchain
  useEffect(() => {
    setTournaments([
      {
        id: 1,
        name: 'Grand Championship',
        format: 'SingleElimination',
        status: 'Registration',
        entryFee: 50,
        prizePool: 5000,
        players: ['0x123...', '0x456...', '0x789...'],
        maxPlayers: 32,
        currentRound: 0
      },
      {
        id: 2,
        name: 'Weekly Blitz',
        format: 'Swiss',
        status: 'InProgress',
        entryFee: 10,
        prizePool: 1000,
        players: Array(16).fill('0x...'),
        maxPlayers: 64,
        currentRound: 3
      },
      {
        id: 3,
        name: 'Speed Masters',
        format: 'RoundRobin',
        status: 'Completed',
        entryFee: 25,
        prizePool: 2500,
        players: Array(8).fill('0x...'),
        maxPlayers: 8,
        currentRound: 7
      }
    ]);
  }, []);

  const filteredTournaments = tournaments.filter(t => {
    if (activeTab === 'upcoming') return t.status === 'Registration';
    if (activeTab === 'live') return t.status === 'InProgress';
    return t.status === 'Completed';
  });

  const handleCreateTournament = async (formData: any) => {
    try {
      await createTournament(
        formData.name,
        formData.format,
        formData.entryFee,
        formData.maxPlayers
      );
      setIsCreating(false);
      toast.success('Tournament created!');
    } catch (error) {
      toast.error('Failed to create tournament');
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    try {
      await joinTournament(tournamentId);
      toast.success('Joined tournament!');
    } catch (error) {
      toast.error('Failed to join tournament');
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
      case 'SingleElimination': return <Target size={16} className="text-red-400" />;
      case 'Swiss': return <TrendingUp size={16} className="text-blue-400" />;
      case 'RoundRobin': return <Users size={16} className="text-green-400" />;
      default: return <Trophy size={16} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
        <p className="text-gray-400">Compete against the best and win prizes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{tournaments.length}</div>
              <div className="text-sm text-gray-400">Total Tournaments</div>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <Trophy size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {tournaments.filter(t => t.status === 'InProgress').length}
              </div>
              <div className="text-sm text-gray-400">Live Now</div>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg">
              <Zap size={24} className="text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {tournaments.reduce((acc, t) => acc + t.players.length, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Players</div>
            </div>
            <div className="p-3 bg-cyan-900/30 rounded-lg">
              <Users size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {tournaments.reduce((acc, t) => acc + t.prizePool, 0).toLocaleString()} LIN
              </div>
              <div className="text-sm text-gray-400">Total Prize Pool</div>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded-lg">
              <Crown size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8">
        {(['upcoming', 'live', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                : 'bg-gray-800/50 hover:bg-gray-800'
            }`}
          >
            {tab === 'upcoming' && <Calendar size={20} />}
            {tab === 'live' && <Zap size={20} />}
            {tab === 'completed' && <Award size={20} />}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
        
        <button
          onClick={() => setIsCreating(true)}
          className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold flex items-center space-x-2"
        >
          <Trophy size={20} />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTournaments.map((tournament) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
            onClick={() => setSelectedTournament(tournament)}
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(tournament.players.length / tournament.maxPlayers) * 100}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex -space-x-2">
                {tournament.players.slice(0, 5).map((player, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs"
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinTournament(tournament.id);
                }}
                disabled={tournament.status !== 'Registration' || tournament.players.length >= tournament.maxPlayers}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tournament.status === 'Registration' ? 'Join Now' : 'View Details'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {isCreating && (
          <CreateTournamentModal
            onClose={() => setIsCreating(false)}
            onCreate={handleCreateTournament}
          />
        )}
      </AnimatePresence>

      {/* Tournament Detail Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <TournamentDetailModal
            tournament={selectedTournament}
            onClose={() => setSelectedTournament(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Modal Components
const CreateTournamentModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    format: 'SingleElimination',
    entryFee: '',
    maxPlayers: '32',
    prizeDistribution: [50, 30, 20]
  });

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
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tournament Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Weekly Championship"
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
              <option value="Swiss">Swiss System (5 rounds)</option>
              <option value="RoundRobin">Round Robin</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Entry Fee (LIN)</label>
              <input
                type="number"
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
                <option value="128">128 Players</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Prize Distribution (%)</label>
            <div className="flex space-x-2">
              {formData.prizeDistribution.map((percent, index) => (
                <div key={index} className="flex-1">
                  <div className="text-center text-sm text-gray-400 mb-1">
                    {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                  </div>
                  <input
                    type="number"
                    value={percent}
                    onChange={(e) => {
                      const newDist = [...formData.prizeDistribution];
                      newDist[index] = parseInt(e.target.value) || 0;
                      setFormData({...formData, prizeDistribution: newDist});
                    }}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-center"
                  />
                </div>
              ))}
            </div>
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
            onClick={() => onCreate(formData)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
          >
            Create Tournament
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TournamentDetailModal: React.FC<{
  tournament: Tournament;
  onClose: () => void;
}> = ({ tournament, onClose }) => {
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
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">{tournament.name}</h2>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-800/30">
                {tournament.format.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="flex items-center space-x-1 text-gray-400">
                <Users size={16} />
                <span>{tournament.players.length}/{tournament.maxPlayers} Players</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gray-800/30 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">Entry Fee</div>
            <div className="text-2xl font-bold">
              {tournament.entryFee ? `${tournament.entryFee} LIN` : 'FREE'}
            </div>
          </div>
          
          <div className="p-6 bg-gray-800/30 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">Prize Pool</div>
            <div className="text-2xl font-bold text-yellow-400">
              {tournament.prizePool.toLocaleString()} LIN
            </div>
          </div>
          
          <div className="p-6 bg-gray-800/30 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">Status</div>
            <div className="text-2xl font-bold">
              {tournament.status}
            </div>
          </div>
        </div>
        
        {/* Bracket Preview */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Tournament Bracket</h3>
          <div className="bg-gray-800/20 rounded-xl p-6 border border-gray-700">
            <div className="text-center text-gray-400">
              Bracket will be displayed here when tournament starts
            </div>
          </div>
        </div>
        
        {/* Players List */}
        <div>
          <h3 className="text-xl font-bold mb-4">Registered Players</h3>
          <div className="space-y-2">
            {tournament.players.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/20 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">Player {index + 1}</div>
                    <div className="text-sm text-gray-400">{player}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">ELO: 1520</div>
                  <div className="text-sm text-gray-400">62% Win Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};