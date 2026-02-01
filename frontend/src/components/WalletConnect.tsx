import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, Copy, Check, Coins } from 'lucide-react';
import {
  useDynamicContext,
  useIsLoggedIn,
} from '@dynamic-labs/sdk-react-core';
import { useLineraGame } from '../hooks/useLineraGame';
import toast from 'react-hot-toast';

function shortenAddress(address: string | undefined | null): string {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const WalletConnect: React.FC = () => {
  const { isConnected, address: lineraAddress, balance, connectWallet } = useLineraGame();

  const {
    sdkHasLoaded,
    primaryWallet,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();

  const isLoggedIn = useIsLoggedIn();

  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Auto-connect to Linera once Dynamic wallet is authenticated
  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet && !isConnected) {
      connectWallet().catch((err) => {
        console.error('Auto Linera connect failed:', err);
        toast.error('Failed to connect to Linera automatically');
      });
    }
  }, [sdkHasLoaded, isLoggedIn, primaryWallet, isConnected, connectWallet]);

  if (!sdkHasLoaded) {
    return null; // or <div className="animate-pulse">Loading wallet...</div>
  }

  const handleConnect = () => {
    if (isLoggedIn && primaryWallet) {
      connectWallet().catch((err) => {
        console.error(err);
        toast.error('Failed to connect to Linera');
      });
    } else {
      setShowAuthFlow(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      await handleLogOut();
      toast.success('Wallet disconnected');
      setShowMenu(false);
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Failed to disconnect wallet');
    }
  };

  const copyAddress = () => {
    const addr = primaryWallet?.address || lineraAddress;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    // TODO: Replace with real Linera deposit transaction
    toast.success(`Deposited ${amount} LIN (mock transaction)`);
    setDepositAmount('');
    setShowMenu(false);
  };

  // Not connected or not logged in → show connect button
  if (!isConnected || !isLoggedIn) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConnect}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold flex items-center space-x-3 shadow-lg hover:brightness-110 transition"
        >
          <Wallet size={20} />
          <span>Connect Wallet</span>
        </motion.button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        {/* Connected Wallet Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMenu(!showMenu)}
          className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl font-bold flex items-center space-x-3 shadow-lg hover:brightness-110 transition"
        >
          <Wallet size={20} />
          <div className="text-left">
            <div className="text-sm font-medium">{balance.toLocaleString()} LIN</div>
            <div className="text-xs text-gray-400">
              {shortenAddress(primaryWallet?.address || lineraAddress)}
            </div>
          </div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-4 w-80 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-5 shadow-2xl"
            >
              <div className="space-y-5">
                {/* Balance Card */}
                <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-cyan-900/40 rounded-lg">
                        <Coins size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Balance</div>
                        <div className="text-2xl font-bold">{balance.toLocaleString()} LIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                    <code className="text-sm font-mono break-all">
                      {shortenAddress(primaryWallet?.address || lineraAddress)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Deposit Section */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Deposit LIN</div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleDeposit}
                      className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold hover:brightness-110 transition"
                    >
                      Deposit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(amt.toString())}
                        className="px-3 py-1 text-sm bg-gray-800/40 rounded hover:bg-gray-700/60 transition"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition text-center">
                    <div className="text-sm font-medium">Withdraw</div>
                    <div className="text-xs text-gray-500">Transfer out</div>
                  </button>
                  <button className="p-3 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition text-center">
                    <div className="text-sm font-medium">History</div>
                    <div className="text-xs text-gray-500">Transactions</div>
                  </button>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={handleDisconnect}
                  className="w-full p-3 mt-2 bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-800/40 rounded-lg flex items-center justify-center space-x-2 hover:brightness-110 transition"
                >
                  <LogOut size={16} />
                  <span>Disconnect</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
