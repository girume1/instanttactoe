import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Trophy, TrendingUp, Award, Clock, 
  Star, Target, Zap, Shield, Gamepad2,
  Edit2, Copy, Check, Settings, Bell, Globe
} from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';

export const Profile: React.FC = () => {
  const { address, nickname, setPlayerNickname } = useLineraGame();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(nickname);
  const [copied, setCopied] = useState(false);

  const stats = {
    elo: 1542,
    rank: 42,
    wins: 124,
    losses: 78,
    draws: 12,
    winRate: 62,
    streak: 5,
    totalGames: 214,
    bestStreak: 12
  };

  const achievements = [
    { id: 1, name: 'First Win', earned: true, date: '2024-01-15' },
    { id: 2, name: 'Tournament Champion', earned: true, date: '2024-02-20' },
    { id: 3, name: 'Speed Demon', earned: false, date: null },
    { id: 4, name: 'Perfect Game', earned: true, date: '2024-03-05' },
    { id: 5, name: 'Guild Leader', earned: false, date: null },
  ];

  const recentGames = [
    { id: 1, result: 'win', opponent: 'PlayerX', mode: 'Classic', duration: '2:30' },
    { id: 2, result: 'loss', opponent: 'PlayerO', mode: 'Speed', duration: '1:15' },
    { id: 3, result: 'win', opponent: 'Champ', mode: 'PowerUp', duration: '3:45' },
    { id: 4, result: 'draw', opponent: 'Master', mode: 'Classic', duration: '4:20' },
  ];

  const handleSaveNickname = async () => {
    if (newNickname.trim()) {
      await setPlayerNickname(newNickname);
      setIsEditingNickname(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <User size={48} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-gray-900">
                <span className="font-bold">42</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {isEditingNickname ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNickname(false);
                        setNewNickname(nickname);
                      }}
                      className="px-3 py-1 bg-gray-800/50 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">{nickname || 'Anonymous'}</h1>
                    <button
                      onClick={() => setIsEditingNickname(true)}
                      className="p-1 hover:bg-gray-800/50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-gray-400">
                <span className="flex items-center space-x-1">
                  <Globe size={14} />
                  <span>Global Rank: #{stats.rank}</span>
                </span>
                <span>•</span>
                <button
                  onClick={copyAddress}
                  className="flex items-center space-x-1 hover:text-cyan-400 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </div>
        
        {/* ELO and Rank */}
        <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold mb-2">{stats.elo} ELO</div>
              <div className="text-gray-400">Competitive Rating</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-2">#{stats.rank}</div>
              <div className="text-gray-400">Global Rank</div>
            </div>
          </div>
          
          {/* Progress bar to next rank */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress to Top 100</span>
              <span>{Math.round(((100 - stats.rank) / 100) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((100 - stats.rank) / 100) * 100}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.wins}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg">
              <Trophy size={24} className="text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.losses}</div>
              <div className="text-sm text-gray-400">Losses</div>
            </div>
            <div className="p-3 bg-red-900/30 rounded-lg">
              <Target size={24} className="text-red-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded-lg">
              <TrendingUp size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.streak}</div>
              <div className="text-sm text-gray-400">Current Streak</div>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <Zap size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Games */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <Gamepad2 size={24} className="text-cyan-400" />
              <span>Recent Games</span>
            </h2>
            
            <div className="space-y-3">
              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      game.result === 'win' 
                        ? 'bg-green-900/30 text-green-400' 
                        : game.result === 'loss' 
                        ? 'bg-red-900/30 text-red-400' 
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
                    </div>
                    
                    <div>
                      <div className="font-bold">vs {game.opponent}</div>
                      <div className="text-sm text-gray-400">{game.mode}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock size={14} />
                      <span>{game.duration}</span>
                    </div>
                    <div className={`text-sm font-bold ${
                      game.result === 'win' 
                        ? 'text-green-400' 
                        : game.result === 'loss' 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    }`}>
                      {game.result.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg font-bold hover:border-cyan-500 transition-all">
              View All Games
            </button>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <Award size={24} className="text-yellow-400" />
              <span>Achievements</span>
            </h2>
            
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.earned
                      ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800/30'
                      : 'bg-gray-800/30 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                          : 'bg-gray-700'
                      }`}>
                        {achievement.earned ? (
                          <Star size={20} className="text-white" />
                        ) : (
                          <Star size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{achievement.name}</div>
                        {achievement.earned && (
                          <div className="text-sm text-gray-400">{achievement.date}</div>
                        )}
                      </div>
                    </div>
                    
                    {achievement.earned && (
                      <div className="text-yellow-400">
                        <Award size={20} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-bold">
                  {achievements.filter(a => a.earned).length}/{achievements.length}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  style={{ width: `${(achievements.filter(a => a.earned).length / achievements.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};