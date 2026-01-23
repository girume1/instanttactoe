import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Lock, Unlock, Users, Zap, Trophy, Crown, 
  Clock, TrendingUp, Filter, Search, Sword, Shield 
} from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import toast from 'react-hot-toast';

interface Room {
  roomId: number;
  name: string;
  creator: string;
  isFull: boolean;
  hasPassword: boolean;
  playerCount: number;
  mode: string;
  stake?: number;
}

export const Lobby: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    mode: 'all',
    stake: 'all',
    status: 'all'
  });

  const { getLobby, createRoom, joinRoom, address } = useLineraGame();

  // Form state
  const [newRoom, setNewRoom] = useState({
    name: '',
    password: '',
    mode: 'Classic',
    stake: ''
  });

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...rooms];
    
    if (search) {
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filters.mode !== 'all') {
      filtered = filtered.filter(room => room.mode === filters.mode);
    }
    
    if (filters.stake !== 'all') {
      if (filters.stake === 'staked') {
        filtered = filtered.filter(room => room.stake && room.stake > 0);
      } else {
        filtered = filtered.filter(room => !room.stake || room.stake === 0);
      }
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(room => 
        filters.status === 'open' ? !room.isFull : room.isFull
      );
    }
    
    setFilteredRooms(filtered);
  }, [rooms, search, filters]);

  const loadRooms = async () => {
    try {
      const lobbyData = await getLobby();
      setRooms(lobbyData);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    try {
      await createRoom(
        newRoom.name,
        newRoom.password || undefined,
        newRoom.mode,
        newRoom.stake ? parseInt(newRoom.stake) : undefined
      );
      
      setIsCreating(false);
      setNewRoom({ name: '', password: '', mode: 'Classic', stake: '' });
      toast.success('Room created successfully!');
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId: number, hasPassword: boolean) => {
    let password;
    
    if (hasPassword) {
      password = prompt('Enter room password:');
      if (!password) return;
    }
    
    try {
      await joinRoom(roomId, password);
      // Navigate to game page
      window.location.href = `/game/${roomId}`;
    } catch (error) {
      toast.error('Failed to join room');
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Speed': return <Zap size={16} className="text-yellow-400" />;
      case 'Tournament': return <Trophy size={16} className="text-purple-400" />;
      case 'PowerUp': return <Sword size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Lobby</h1>
        <p className="text-gray-400">Join existing games or create your own challenge</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <div className="text-sm text-gray-400">Active Games</div>
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
                {rooms.filter(r => r.stake && r.stake > 0).length}
              </div>
              <div className="text-sm text-gray-400">Staked Games</div>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg">
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {rooms.filter(r => r.mode === 'Speed').length}
              </div>
              <div className="text-sm text-gray-400">Speed Games</div>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded-lg">
              <Zap size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {rooms.reduce((acc, r) => acc + (r.stake || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Staked</div>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <Crown size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filters.mode}
            onChange={(e) => setFilters({...filters, mode: e.target.value})}
            className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Modes</option>
            <option value="Classic">Classic</option>
            <option value="Speed">Speed</option>
            <option value="PowerUp">Power Up</option>
            <option value="Tournament">Tournament</option>
          </select>
          
          <select
            value={filters.stake}
            onChange={(e) => setFilters({...filters, stake: e.target.value})}
            className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Games</option>
            <option value="staked">Staked Only</option>
            <option value="free">Free Games</option>
          </select>
          
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">Create New Game</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., Pro League Match"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Password (Optional)</label>
                  <input
                    type="password"
                    value={newRoom.password}
                    onChange={(e) => setNewRoom({...newRoom, password: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="Leave empty for public game"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Game Mode</label>
                  <select
                    value={newRoom.mode}
                    onChange={(e) => setNewRoom({...newRoom, mode: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Classic">Classic (Normal)</option>
                    <option value="Speed">Speed (10s per move)</option>
                    <option value="PowerUp">Power Up (Special Abilities)</option>
                    <option value="Tournament">Tournament Mode</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Stake Amount (Optional)</label>
                  <input
                    type="number"
                    value={newRoom.stake}
                    onChange={(e) => setNewRoom({...newRoom, stake: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="0 for friendly match"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-3 border border-gray-700 rounded-lg font-medium hover:bg-gray-800/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
                >
                  Create Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRooms.map((room) => (
            <motion.div
              key={room.roomId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
              onClick={() => handleJoinRoom(room.roomId, room.hasPassword)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>#{room.roomId}</span>
                    <span>•</span>
                    <span>by {room.creator.slice(0, 8)}...</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {room.hasPassword ? (
                    <Lock size={16} className="text-yellow-400" />
                  ) : (
                    <Unlock size={16} className="text-green-400" />
                  )}
                  {room.stake && room.stake > 0 && (
                    <div className="px-2 py-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded text-xs font-bold">
                      {room.stake} LIN
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getModeIcon(room.mode)}
                    <span className="font-medium">{room.mode}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-gray-400" />
                    <span>{room.playerCount}/2</span>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  room.isFull 
                    ? 'bg-red-900/30 text-red-400' 
                    : 'bg-green-900/30 text-green-400'
                }`}>
                  {room.isFull ? 'Full' : 'Open'}
                </div>
              </div>
              
              <button className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg font-bold hover:border-cyan-500 transition-all">
                {room.hasPassword ? 'Enter Password to Join' : 'Join Game'}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredRooms.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold mb-2">No games found</h3>
            <p className="text-gray-400 mb-6">Be the first to create a game!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
            >
              Create First Game
            </button>
          </div>
        )}
      </div>
      
      {/* Quick Play Button */}
      <div className="mt-12 text-center">
        <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 mx-auto">
          <Zap size={24} />
          <span>Quick Play (Find Opponent)</span>
        </button>
        <p className="text-gray-400 mt-2">Instantly match with a player of similar skill</p>
      </div>
    </div>
  );
};