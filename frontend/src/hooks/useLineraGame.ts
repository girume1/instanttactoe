import { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { lineraAdapter } from '../utils/linera-adapter';
import type { GameState } from '../types';
import toast from 'react-hot-toast';

export const useLineraGame = () => {
  const { primaryWallet, user } = useDynamicContext();
  const [isConnected, setIsConnected] = useState(lineraAdapter.isChainConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(lineraAdapter.address);
  const [balance, setBalance] = useState(0);
  const [nickname, setNickname] = useState('');

  const loadInitialData = async () => {
    try {
      console.log("Loading initial data...");
      // You can load tournaments, lobby, etc. here
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const connectWallet = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    try {
      console.log("Connecting Linera game...");

      if (!primaryWallet) {
        console.warn("No primary wallet available");
        toast.error('Please connect your wallet first');
        return;
      }

      // Connect to Linera first to establish provider
      const provider = await lineraAdapter.connect(primaryWallet);
      console.log("Linera connected:", provider.address);

      // Then set application ID
      await lineraAdapter.setApplication();
      console.log("Application set");

      setIsConnected(true);
      setAddress(provider.address);

      // Get balance from the contract
      try {
        const currentBalance = await lineraAdapter.getBalance();
        setBalance(currentBalance);
        console.log("Balance:", currentBalance);
      } catch (balanceError) {
        console.log("Balance not available yet", balanceError);
        setBalance(0);
      }

      toast.success('Connected to game!');

      // Load initial data
      setTimeout(() => {
        loadInitialData();
      }, 500);
    } catch (error: any) {
      console.error('Failed to connect to Linera:', error);
      toast.error(`Connection failed: ${error.message || 'Unknown error'}`);

      // Reset state on error
      setIsConnected(false);
      setAddress(null);
      setBalance(0);
    } finally {
      setIsConnecting(false);
    }
  }, [primaryWallet, isConnecting, isConnected]);

  useEffect(() => {
    if (user) {
      setNickname(user.username || '');
    }
  }, [user]);

  useEffect(() => {
    const syncFromAdapter = () => {
      const connected = lineraAdapter.isChainConnected();
      setIsConnected(connected);
      setAddress(lineraAdapter.address);
      if (!connected) {
        setBalance(0);
      }
    };

    syncFromAdapter();
    lineraAdapter.onConnectionStateChange(syncFromAdapter);
    return () => {
      lineraAdapter.offConnectionStateChange();
    };
  }, []);

  const setPlayerNickname = async (name: string) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'SetNickname',
        name
      });
      setNickname(name);
      toast.success(`Nickname set to ${name}`);
      return result;
    } catch (error) {
      toast.error('Failed to set nickname');
      throw error;
    }
  };

  const createRoom = async (roomName: string, password?: string, mode?: string, stake?: number) => {
    try {
      const operation = {
        type: 'CreateMatch',
        room_name: roomName,
        password: password || null,
        mode: mode || 'Classic',
        stake: stake || null
      };

      const result = await lineraAdapter.executeOperation(operation);
      toast.success('Room created successfully!');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
      throw error;
    }
  };

  const joinRoom = async (roomId: number, password?: string) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'JoinGame',
        room_id: roomId,
        password: password || null
      });
      toast.success('Joined room!');
      return result;
    } catch (error) {
      toast.error('Failed to join room');
      throw error;
    }
  };

  const makeMove = async (roomId: number, position: number) => {
    try {
      const result = await lineraAdapter.executeOperation({
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

  const getLobby = async (): Promise<any[]> => {
    try {
      const res: any = await lineraAdapter.queryApplication({ type: 'GetLobby' });
      return Array.isArray(res) ? (res as any[]) : [];
    } catch (error) {
      toast.error('Failed to fetch lobby');
      return [];
    }
  };

  const getGameState = async (roomId: number): Promise<any | null> => {
    try {
      const response = await lineraAdapter.queryApplication<GameState>({
        type: 'GetBoard',
        room_id: roomId
      });

      // Ensure response is properly typed
      return response || null;
    } catch (error) {
      console.error('Failed to fetch game state:', error);
      toast.error('Failed to fetch game state');
      return null;
    }
  };

  const createTournament = async (name: string, format: string, entryFee?: number, maxPlayers: number = 32) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'CreateTournament',
        name,
        format,
        entry_fee: entryFee || null,
        max_players: maxPlayers,
        prize_distribution: [50, 30, 20]
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
      const result = await lineraAdapter.executeOperation({
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

  const createGuild = async (name: string, tag: string) => {
    try {
      const result = await lineraAdapter.executeOperation({
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

  const disconnectWallet = () => {
    lineraAdapter.reset();
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
  };

  return {
    isConnected,
    isConnecting,
    address,
    balance,
    nickname,
    connectWallet,
    disconnectWallet,
    setPlayerNickname,
    createRoom,
    joinRoom,
    makeMove,
    getLobby,
    getGameState,
    createTournament,
    joinTournament,
    createGuild
  };
};
