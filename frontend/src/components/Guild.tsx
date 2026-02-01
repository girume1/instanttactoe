import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Crown, Award, 
  Plus, Users2, Castle, Coins
} from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import toast from 'react-hot-toast';

interface Guild {
  id: number;
  name: string;
  tag: string;
  level: number;
  members: number;
  treasury: number;
  description: string;
  wins: number;
  losses: number;
  leader: string;
}

export const GuildComponent: React.FC = () => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [userGuild] = useState<Guild | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { createGuild } = useLineraGame();

  useEffect(() => {
    // Mock data
    setGuilds([
      {
        id: 1,
        name: 'Tic Tac Titans',
        tag: 'TTT',
        level: 15,
        members: 42,
        treasury: 12500,
        description: 'Top competitive guild aiming for championships',
        wins: 342,
        losses: 89,
        leader: '0x123...789'
      },
      {
        id: 2,
        name: 'Cross Masters',
        tag: 'XOX',
        level: 12,
        members: 38,
        treasury: 8900,
        description: 'Friendly community focused on improving skills',
        wins: 289,
        losses: 120,
        leader: '0x456...abc'
      },
      {
        id: 3,
        name: 'Strategic Gamers',
        tag: 'STRAT',
        level: 10,
        members: 35,
        treasury: 5600,
        description: 'Analytical players studying game theory',
        wins: 234,
        losses: 98,
        leader: '0x789...def'
      }
    ]);
  }, []);

  const handleCreateGuild = async (name: string, tag: string) => {
    try {
      await createGuild(name, tag);
      setIsCreating(false);
      toast.success('Guild created!');
    } catch (error) {
      toast.error('Failed to create guild');
    }
  };

  const getWinRate = (guild: Guild) => {
    const total = guild.wins + guild.losses;
    return total > 0 ? Math.round((guild.wins / total) * 100) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Guilds</h1>
        <p className="text-gray-400">Join forces with other players and compete together</p>
      </div>

      {/* User Guild Card */}
      {userGuild ? (
        <div className="mb-8 p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Castle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userGuild.name} [{userGuild.tag}]</h2>
                <div className="flex items-center space-x-4 text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Crown size={16} />
                    <span>Level {userGuild.level}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{userGuild.members} Members</span>
                  </span>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold">
              Manage Guild
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl">
          <div className="text-center py-8">
            <Users2 size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">You're not in a guild yet</h3>
            <p className="text-gray-400 mb-6">Join or create a guild to compete in team events and earn rewards</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
            >
              <span className="flex items-center space-x-2">
                <Plus size={20} />
                <span>Create Guild</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Guild Rankings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Top Guilds</h2>
        <div className="space-y-4">
          {guilds.map((guild, index) => (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Award size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold">{guild.name} [{guild.tag}]</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Crown size={14} />
                        <span>Level {guild.level}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{guild.members} Members</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Coins size={14} />
                        <span>{guild.treasury.toLocaleString()} LIN</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">{getWinRate(guild)}% Win Rate</div>
                  <div className="text-sm text-gray-400">
                    {guild.wins}W • {guild.losses}L
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-gray-400">{guild.description}</p>
              
              <div className="flex justify-between items-center mt-6">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(5, guild.members) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full border-2 border-gray-900"
                    />
                  ))}
                  {guild.members > 5 && (
                    <div className="w-8 h-8 bg-gray-800 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs">
                      +{guild.members - 5}
                    </div>
                  )}
                </div>
                
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold">
                  Join Guild
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Guild Modal */}
      {isCreating && (
        <CreateGuildModal
          onClose={() => setIsCreating(false)}
          onCreate={handleCreateGuild}
        />
      )}
    </div>
  );
};

const CreateGuildModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, tag: string) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !tag.trim()) {
      toast.error('Guild name and tag are required');
      return;
    }
    if (tag.length > 5) {
      toast.error('Tag must be 5 characters or less');
      return;
    }
    onCreate(name, tag);
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
        <h2 className="text-2xl font-bold mb-6">Create Guild</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Guild Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Tic Tac Titans"
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Guild Tag (3-5 chars)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-lg"
              placeholder="TTT"
              maxLength={5}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              placeholder="Describe your guild's purpose and goals"
              rows={3}
              maxLength={200}
            />
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
            Create Guild
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};