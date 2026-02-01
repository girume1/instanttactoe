// src/hooks/useLineraGame.ts
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

  // Loaded data from contract
  const [lobby, setLobby] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  // Load lobby, tournaments, guilds on connect
  const loadInitialData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingInitial(true);

    try {
      // Load open games / lobby
      const lobbyData = await lineraAdapter.queryApplication<any[]>({
        type: 'GetLobby',
      });
      setLobby(lobbyData || []);
      console.log("Lobby loaded:", lobbyData);

      // Load active tournaments
      const tournamentsData = await lineraAdapter.queryApplication<any[]>({
        type: 'GetTournaments',
      });
      setTournaments(tournamentsData || []);
      console.log("Tournaments loaded:", tournamentsData);

      // Load available guilds
      const guildsData = await lineraAdapter.queryApplication<any[]>({
        type: 'GetGuilds',
      });
      setGuilds(guildsData || []);
      console.log("Guilds loaded:", guildsData);

    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Could not load game data");
    } finally {
      setIsLoadingInitial(false);
    }
  }, [isConnected]);

  const connectWallet = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);

    try {
      if (!primaryWallet) {
        toast.error("Please connect your wallet first");
        return;
      }

      const provider = await lineraAdapter.connect(primaryWallet);
      await lineraAdapter.setApplication();

      setIsConnected(true);
      setAddress(provider.address);

      const currentBalance = await lineraAdapter.getBalance().catch(() => 0);
      setBalance(currentBalance);

      toast.success("Connected to Linera!");
      await loadInitialData();
    } catch (error: any) {
      console.error("Linera connection failed:", error);
      toast.error(`Connection failed: ${error.message || "Unknown error"}`);

      setIsConnected(false);
      setAddress(null);
      setBalance(0);
    } finally {
      setIsConnecting(false);
    }
  }, [primaryWallet, isConnecting, isConnected, loadInitialData]);

  useEffect(() => {
    if (primaryWallet && !isConnected && !isConnecting) {
      connectWallet();
    }
  }, [primaryWallet, isConnected, isConnecting, connectWallet]);

  useEffect(() => {
    const syncFromAdapter = () => {
      const connected = lineraAdapter.isChainConnected();
      setIsConnected(connected);
      setAddress(lineraAdapter.address);

      if (!connected) {
        setBalance(0);
        setNickname("");
        setLobby([]);
        setTournaments([]);
        setGuilds([]);
      }
    };

    syncFromAdapter();
    lineraAdapter.onConnectionStateChange(syncFromAdapter);

    return () => {
      lineraAdapter.offConnectionStateChange();
    };
  }, []);

  useEffect(() => {
    if (user?.username) {
      setNickname(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(async () => {
      try {
        const newBalance = await lineraAdapter.getBalance();
        setBalance(newBalance);
      } catch {}
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const setPlayerNickname = async (name: string) => {
    try {
      await lineraAdapter.executeOperation({
        type: 'SetNickname',
        name
      });
      setNickname(name);
      toast.success(`Nickname set to ${name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set nickname');
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
      await loadInitialData(); // refresh lobby
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
      await loadInitialData(); // refresh lobby
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
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
    } catch (error: any) {
      toast.error(error.message || 'Move failed');
      throw error;
    }
  };

  const getLobby = async (): Promise<any[]> => {
    try {
      const res = await lineraAdapter.queryApplication({ type: 'GetLobby' });
      return Array.isArray(res) ? res : [];
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
      await loadInitialData(); // refresh tournaments
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
      await loadInitialData(); // refresh tournaments
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
      await loadInitialData(); // refresh guilds
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
    setNickname('');
    setLobby([]);
    setTournaments([]);
    setGuilds([]);
  };

  return {
    isConnected,
    isConnecting,
    isLoadingInitial,
    address,
    balance,
    nickname,
    lobby,
    tournaments,
    guilds,
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
