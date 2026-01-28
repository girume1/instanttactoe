import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock, Unlock, Users, Zap, Trophy, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLineraGame } from '../hooks/useLineraGame';
import type { Room } from '../types';
import toast from 'react-hot-toast';

interface CreateRoomForm {
  name: string;
  password: string;
  mode: string;
  stake: string;
}

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    mode: 'all',
    stake: 'all',
    status: 'all'
  });

  const [newRoom, setNewRoom] = useState<CreateRoomForm>({
    name: '',
    password: '',
    mode: 'Classic',
    stake: ''
  });

  const { getLobby, createRoom, joinRoom, address, isConnected } = useLineraGame();

  useEffect(() => {
    if (!isConnected) {
      toast.error('Connect your wallet first');
      navigate('/');
      return;
    }
    loadRooms();
    const interval = setInterval(loadRooms, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [isConnected, navigate]);

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
      setLoading(true);
      const lobbyData = await getLobby();
      
      // Transform blockchain response to Room type
      const transformedRooms: Room[] = lobbyData.map((roomData: any) => ({
        roomId: roomData.room_id || roomData.id || 0,
        name: roomData.name || 'Unnamed Room',
        creator: roomData.creator || 'Unknown',
        isFull: roomData.is_full || false,
        hasPassword: roomData.has_password || false,
        playerCount: roomData.player_count || 0,
        mode: roomData.mode || 'Classic',
        stake: roomData.stake || undefined
      }));
      
      setRooms(transformedRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }

    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (newRoom.stake && (isNaN(Number(newRoom.stake)) || Number(newRoom.stake) < 0)) {
      toast.error('Invalid stake amount');
      return;
    }

    try {
      const stakeAmount = newRoom.stake ? parseInt(newRoom.stake) : undefined;
      
      const result = await createRoom(
        newRoom.name.trim(),
        newRoom.password.trim() || undefined,
        newRoom.mode,
        stakeAmount
      );
      
      // Check if result contains room ID
      if (result && (result.room_id || result.id)) {
        const roomId = result.room_id || result.id;
        setIsCreating(false);
        setNewRoom({ name: '', password: '', mode: 'Classic', stake: '' });
        toast.success('Room created successfully!');
        
        // Navigate to the new room
        navigate(`/game/${roomId}`);
      } else {
        toast.error('Failed to create room');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async (room: Room) => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }

    if (room.isFull) {
      toast.error('Room is full');
      return;
    }

    let password;
    if (room.hasPassword) {
      password = prompt('Enter room password:');
      if (!password) return;
    }

    try {
      await joinRoom(room.roomId, password);
      toast.success('Joined room!');
      navigate(`/game/${room.roomId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Speed': return <Zap size={16} className="text-yellow-400" />;
      case 'Tournament': return <Trophy size={16} className="text-purple-400" />;
      case 'PowerUp': return <Zap size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-cyan-400" />;
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold mb-2">Wallet Not Connected</h3>
        <p className="text-gray-400 mb-6">Please connect your wallet to view the lobby</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Lobby</h1>
        <p className="text-gray-400">Real-time games from the blockchain</p>
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
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filters.mode}
            onChange={(e) => setFilters({...filters, mode: e.target.value})}
            className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
            disabled={loading}
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
            disabled={loading}
          >
            <option value="all">All Games</option>
            <option value="staked">Staked Only</option>
            <option value="free">Free Games</option>
          </select>
          
          <button
            onClick={() => setIsCreating(true)}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold flex items-center space-x-2 disabled:opacity-50"
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
                  <label className="block text-sm font-medium mb-2">Room Name *</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., Pro League Match"
                    required
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
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Stake Amount (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={newRoom.stake}
                    onChange={(e) => setNewRoom({...newRoom, stake: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="0 for friendly match"
                  />
                  <p className="text-xs text-gray-400 mt-1">Your balance will be used as stake</p>
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

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Loading games from blockchain...</p>
        </div>
      ) : (
        <>
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
                  onClick={() => handleJoinRoom(room)}
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
                  
                  <button 
                    className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg font-bold hover:border-cyan-500 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRoom(room);
                    }}
                  >
                    {room.hasPassword ? 'Enter Password to Join' : 'Join Game'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Empty State */}
          {filteredRooms.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-2">No active games found</h3>
              <p className="text-gray-400 mb-6">Be the first to create a game on the blockchain!</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
              >
                Create First Game
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};