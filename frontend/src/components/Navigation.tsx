import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Gamepad2, Trophy, Users, User, Wallet, 
  Sword, Shield, Zap, Crown 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLineraGame } from '../hooks/useLineraGame';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { balance } = useLineraGame();
  
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/tournaments', label: 'Tournaments', icon: <Trophy size={20} /> },
    { path: '/guilds', label: 'Guilds', icon: <Users size={20} /> },
    { path: '/profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg"
            >
              <Gamepad2 size={24} />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                InstantTacToe Pro
              </h1>
              <p className="text-xs text-gray-400">Ultimate On-Chain Strategy</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                    isActive 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Balance & Stats */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                <Wallet size={18} className="text-cyan-400" />
                <span className="font-bold">{balance.toLocaleString()} LIN</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm">
                  <Sword size={16} className="text-green-400" />
                  <span>1,245</span>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Crown size={16} className="text-yellow-400" />
                  <span>#42</span>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Zap size={16} className="text-orange-400" />
                  <span>12</span>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg bg-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};