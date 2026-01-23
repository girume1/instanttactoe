import { useState, useEffect, useCallback } from 'react';
import { lineraClient } from '../utils/linera';
import toast from 'react-hot-toast';

export const useLineraGame = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [nickname, setNickname] = useState('');

  const connectWallet = useCallback(async () => {
    try {
      const connected = await lineraClient.connect();
      if (connected) {
        setIsConnected(true);
        const addr = lineraClient.getAddress();
        setAddress(addr);
        
        // Get initial data
        const bal = await lineraClient.getBalance();
        setBalance(bal);
        
        toast.success('Wallet connected!');
      }
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  }, []);

  const setPlayerNickname = async (name: string) => {
    try {
      await lineraClient.executeOperation({
        type: 'SetNickname',
        name
      });
      setNickname(name);
      toast.success(`Nickname set to ${name}`);
    } catch (error) {
      toast.error('Failed to set nickname');
    }
  };

  const createRoom = async (roomName: string, password?: string, mode?: string, stake?: number) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'CreateMatch',
        room_name: roomName,
        password: password || null,
        mode: mode || 'Classic',
        stake: stake || null
      });
      toast.success('Room created successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to create room');
      throw error;
    }
  };

  const joinRoom = async (roomId: number, password?: string) => {
    try {
      await lineraClient.executeOperation({
        type: 'JoinGame',
        room_id: roomId,
        password: password || null
      });
      toast.success('Joined room!');
    } catch (error) {
      toast.error('Failed to join room');
      throw error;
    }
  };

  const makeMove = async (roomId: number, position: number) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'MakeMove',
        room_id: roomId,
        position
      });
      return result;
    } catch (error) {
      toast.error('Move failed');
      throw error;
    }
  };

  const getLobby = async () => {
    try {
      const response = await lineraClient.query({ type: 'GetLobby' });
      return response;
    } catch (error) {
      toast.error('Failed to fetch lobby');
      return [];
    }
  };

  const getGameState = async (roomId: number) => {
    try {
      const response = await lineraClient.query({
        type: 'GetBoard',
        room_id: roomId
      });
      return response;
    } catch (error) {
      toast.error('Failed to fetch game state');
      return null;
    }
  };

  // Tournament functions
  const createTournament = async (name: string, format: string, entryFee?: number, maxPlayers: number = 32) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'CreateTournament',
        name,
        format,
        entry_fee: entryFee || null,
        max_players: maxPlayers,
        prize_distribution: [50, 30, 20] // 1st: 50%, 2nd: 30%, 3rd: 20%
      });
      toast.success('Tournament created!');
      return result;
    } catch (error) {
      toast.error('Failed to create tournament');
      throw error;
    }
  };

  const joinTournament = async (tournamentId: number) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'JoinTournament',
        tournament_id: tournamentId
      });
      toast.success('Joined tournament!');
      return result;
    } catch (error) {
      toast.error('Failed to join tournament');
      throw error;
    }
  };

  // Guild functions
  const createGuild = async (name: string, tag: string) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'CreateGuild',
        name,
        tag
      });
      toast.success('Guild created!');
      return result;
    } catch (error) {
      toast.error('Failed to create guild');
      throw error;
    }
  };

  // Deposit/Withdraw
  const depositTokens = async (amount: number) => {
    try {
      await lineraClient.executeOperation({
        type: 'DepositTokens',
        amount
      });
      setBalance(prev => prev + amount);
      toast.success(`Deposited ${amount} tokens`);
    } catch (error) {
      toast.error('Deposit failed');
    }
  };

  useEffect(() => {
    // Auto-connect on mount
    if (!isConnected) {
      connectWallet();
    }
  }, [connectWallet, isConnected]);

  return {
    isConnected,
    address,
    balance,
    nickname,
    connectWallet,
    setPlayerNickname,
    createRoom,
    joinRoom,
    makeMove,
    getLobby,
    getGameState,
    createTournament,
    joinTournament,
    createGuild,
    depositTokens
  };
};