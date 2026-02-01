import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Shield, Bot } from 'lucide-react';
import { useLineraGame } from '../hooks/useLineraGame';
import { lineraAdapter } from '../utils/linera-adapter';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useLineraGame();

  useEffect(() => {
    loadChatHistory();
    const interval = setInterval(loadChatHistory, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const chatData = await lineraAdapter.queryApplication({
        type: 'GetChat',
        room_id: roomId
      });
      
      // Transform blockchain response to ChatMessage type
      if (Array.isArray(chatData)) {
        const transformedMessages: ChatMessage[] = chatData.map((msg: any) => ({
          sender: msg.sender || 'Unknown',
          text: msg.text || '',
          timestamp: msg.timestamp || Date.now(),
          isSystem: msg.sender === 'SYSTEM' || msg.isSystem
        }));
        
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !address || !isConnected) {
      return;
    }

    const tempId = Date.now();
    const tempMessage: ChatMessage = {
      sender: 'You',
      text: newMessage.trim(),
      timestamp: Date.now()
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      // Send message to blockchain
      await lineraAdapter.executeOperation({
        type: 'PostMessage',
        text: newMessage.trim(),
        room_id: roomId
      });
      
      // Refresh chat to get actual message from blockchain
      setTimeout(loadChatHistory, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic update on error
      setMessages(prev => prev.filter(msg => msg.timestamp !== tempId));
      setNewMessage(tempMessage.text);
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

  if (!isConnected) {
    return (
      <div className="flex flex-col h-[400px] p-4">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Connect wallet to chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <Send size={18} />
          </div>
          <span>Game Chat</span>
        </h3>
        <p className="text-sm text-gray-400">Real-time chat with opponent</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500"></div>
            <p className="text-sm text-gray-400 mt-2">Loading chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
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
                      : msg.sender === 'You'
                      ? 'text-cyan-300'
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
          ))
        )}
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
            disabled={!isConnected || loading}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim() || loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};