import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, Trophy, Users, Shield, Gamepad2, Crown, 
  TrendingUp, Lock, Globe, Award 
} from 'lucide-react';
import { Lobby } from '../components/Lobby';

export const Home: React.FC = () => {
  const features = [
    { icon: <Zap />, title: 'Speed Mode', desc: '10-second moves', color: 'from-yellow-500 to-orange-500' },
    { icon: <Trophy />, title: 'Tournaments', desc: 'Compete for prizes', color: 'from-purple-500 to-pink-500' },
    { icon: <Shield />, title: 'Power Ups', desc: 'Special abilities', color: 'from-red-500 to-pink-500' },
    { icon: <Users />, title: 'Guilds', desc: 'Team up & compete', color: 'from-green-500 to-emerald-500' },
    { icon: <Lock />, title: 'Secure', desc: 'On-chain verification', color: 'from-blue-500 to-cyan-500' },
    { icon: <Globe />, title: 'Global', desc: 'Players worldwide', color: 'from-indigo-500 to-purple-500' },
  ];

  const stats = [
    { value: '10,234+', label: 'Active Players', icon: <Users /> },
    { value: '542K+', label: 'Games Played', icon: <Gamepad2 /> },
    { value: '25,432', label: 'Tournaments', icon: <Trophy /> },
    { value: '1.2M LIN', label: 'Total Staked', icon: <TrendingUp /> },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10" />
        
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="inline-flex items-center space-x-3 mb-6 px-6 py-3 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-full border border-cyan-800/30">
              <Zap className="text-yellow-400" size={20} />
              <span className="text-sm font-medium">Now Live on Linera Mainnet</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              The Ultimate{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                On-Chain
              </span>{' '}
              Tic-Tac-Toe
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
              Experience lightning-fast gameplay, compete in tournaments, and earn real rewards 
              on the world's fastest blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/game/create"
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Gamepad2 size={24} />
                  <span>Play Now</span>
                </span>
              </Link>
              
              <Link
                to="/tournaments"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Trophy size={24} />
                  <span>Join Tournament</span>
                </span>
              </Link>
            </div>
          </motion.div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.icon.props === Trophy ? 'from-purple-900/30' : 'from-cyan-900/30'} to-transparent`}>
                    {React.cloneElement(stat.icon, { size: 24, className: 'text-cyan-400' })}
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why InstantTacToe Pro?</h2>
            <p className="text-gray-400 text-lg">Revolutionary features that make gaming better</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                  {React.cloneElement(feature.icon, { size: 24, className: 'text-white' })}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Get started in minutes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your Linera wallet to start playing' },
              { step: '02', title: 'Choose Game Mode', desc: 'Pick from Classic, Speed, or Power Up modes' },
              { step: '03', title: 'Play & Earn', desc: 'Win games, join tournaments, earn rewards' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Lobby */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2">Live Games</h2>
              <p className="text-gray-400">Join ongoing matches or create your own</p>
            </div>
            <div className="flex items-center space-x-2 text-cyan-400">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          </div>
          
          <Lobby />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20 border border-cyan-800/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 animate-shimmer" />
            
            <Crown size={64} className="mx-auto mb-6 text-yellow-400" />
            <h2 className="text-4xl font-bold mb-4">Ready to Become a Champion?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of players competing on the fastest gaming blockchain.
            </p>
            <Link
              to="/game/create"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            >
              <Award size={24} />
              <span>Start Playing Free</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};