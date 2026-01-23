import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Shield, Zap, Bot } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatProps {
  roomId: number;
}

export const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'SYSTEM', text: 'Welcome to the game!', timestamp: Date.now(), isSystem: true },
    { sender: 'Alice', text: 'Good luck!', timestamp: Date.now() - 10000 },
    { sender: 'Bob', text: 'You too!', timestamp: Date.now() - 5000 },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { address } = useLineraGame();

  useEffect(() => {
    // In reality, this would connect to WebSocket or poll for new messages
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !address) return;

    const message: ChatMessage = {
      sender: 'You',
      text: newMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // In reality: await lineraClient.executeOperation({ type: 'PostMessage', ... })
      console.log('Message sent:', newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <Send size={18} />
          </div>
          <span>Game Chat</span>
        </h3>
        <p className="text-sm text-gray-400">Communicate with your opponent</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${msg.sender === 'You' ? 'text-right' : ''}`}>
              <div className={`flex items-center space-x-2 mb-1 ${msg.sender === 'You' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {msg.isSystem ? (
                  <Bot size={14} className="text-yellow-400" />
                ) : msg.sender === 'SYSTEM' ? (
                  <Shield size={14} className="text-cyan-400" />
                ) : (
                  <User size={14} className="text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  msg.isSystem 
                    ? 'text-yellow-400' 
                    : msg.sender === 'SYSTEM' 
                    ? 'text-cyan-400' 
                    : 'text-gray-300'
                }`}>
                  {msg.sender}
                </span>
                <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
              </div>
              <div className={`px-4 py-3 rounded-2xl ${
                msg.isSystem
                  ? 'bg-yellow-900/20 border border-yellow-800/30'
                  : msg.sender === 'SYSTEM'
                  ? 'bg-cyan-900/20 border border-cyan-800/30'
                  : msg.sender === 'You'
                  ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-800/30'
                  : 'bg-gray-800/50 border border-gray-700/50'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
            disabled={!address}
          />
          <button
            onClick={sendMessage}
            disabled={!address || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {['GG', 'Good luck!', 'Nice move!', 'Oops!', 'Rematch?'].map((quickMsg) => (
            <button
              key={quickMsg}
              onClick={() => {
                setNewMessage(quickMsg);
                setTimeout(sendMessage, 100);
              }}
              className="px-3 py-1 text-sm bg-gray-800/30 rounded-lg hover:bg-gray-800/50"
            >
              {quickMsg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};