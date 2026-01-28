import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, Copy, Check, Coins } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import toast from 'react-hot-toast';

export const WalletConnect: React.FC = () => {
  const { isConnected, address, balance, connectWallet } = useLineraGame();
  const [copied, setCopied] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const dynamic = useDynamicContext();

  // Resilient connect handler that triggers Dynamic widget methods (if available)
  const handleConnectClick = async () => {
    try {
      if ((dynamic as any)?.primaryWallet) {
        await connectWallet();
        return;
      }

      // Preferred explicit SDK calls (based on common Dynamic methods)
      if (typeof (dynamic as any).showAuthFlow === "function") {
        await (dynamic as any).showAuthFlow();
      } else if (typeof (dynamic as any).setShowAuthFlow === "function") {
        (dynamic as any).setShowAuthFlow(true);
      } else if (typeof (dynamic as any).showQrcodeModal === "function") {
        await (dynamic as any).showQrcodeModal();
      } else if (typeof (dynamic as any).setShowQrcodeModal === "function") {
        (dynamic as any).setShowQrcodeModal(true);
      } else if (typeof (dynamic as any).setShowBridgeWidget === "function") {
        (dynamic as any).setShowBridgeWidget(true);
      } else {
        // fallback to common names
        const tryMethods = ['open', 'connect', 'show', 'openWidget', 'openModal', 'showWidget', 'showModal', 'login', 'requestConnect'];
        for (const m of tryMethods) {
          if (typeof (dynamic as any)[m] === 'function') {
            try {
              await (dynamic as any)[m]();
              break;
            } catch (err) {
              console.warn(`dynamic.${m}() failed:`, err);
            }
          }
        }
      }

      // wait briefly for SDK to set primaryWallet then proceed with linera connect
      setTimeout(() => {
        if ((dynamic as any)?.primaryWallet) {
          connectWallet().catch((e) => console.error('connectWallet error:', e));
        } else {
          toast.error('Wallet not connected — open the Dynamic widget and authorize.');
          console.log('Dynamic context after show call:', dynamic);
        }
      }, 600);
    } catch (err) {
      console.error('handleConnectClick error:', err);
      toast.error('Failed to open wallet connector');
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }
    toast.success(`Deposited ${amount} LIN`);
    setShowDeposit(false);
    setDepositAmount('');
  };

  if (!isConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConnectClick}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold flex items-center space-x-3 shadow-lg"
        >
          <Wallet size={20} />
          <span>Connect Wallet</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Wallet Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDeposit(!showDeposit)}
          className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl font-bold flex items-center space-x-3 shadow-lg"
        >
          <Wallet size={20} />
          <div className="text-left">
            <div className="text-sm font-medium">{balance.toLocaleString()} LIN</div>
            <div className="text-xs text-gray-400">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </motion.button>

        {/* Wallet Menu */}
        <AnimatePresence>
          {showDeposit && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-3 w-80 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-4 shadow-2xl"
            >
              <div className="space-y-4">
                {/* Balance */}
                <div className="p-3 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-900/30 rounded-lg">
                        <Coins size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Available Balance</div>
                        <div className="text-xl font-bold">{balance.toLocaleString()} LIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <code className="text-sm font-mono">
                      {address?.slice(0, 12)}...{address?.slice(-8)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Deposit */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Deposit Tokens</div>
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
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold"
                    >
                      Deposit
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[10, 50, 100, 500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount.toString())}
                        className="px-3 py-1 text-sm bg-gray-800/30 rounded-lg hover:bg-gray-800/50"
                      >
                        {amount} LIN
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                    <div className="text-center">
                      <div className="text-sm font-medium">Withdraw</div>
                      <div className="text-xs text-gray-400">Transfer out</div>
                    </div>
                  </button>
                  <button className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                    <div className="text-center">
                      <div className="text-sm font-medium">History</div>
                      <div className="text-xs text-gray-400">Transactions</div>
                    </div>
                  </button>
                </div>

                {/* Disconnect */}
                <button className="w-full p-3 bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-800/30 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-900/30 transition-colors">
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