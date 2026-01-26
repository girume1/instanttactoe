import { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { lineraAdapter } from '../utils/linera-adapter';
import toast from 'react-hot-toast';

export const useLineraGame = () => {
  const { primaryWallet, user } = useDynamicContext();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [nickname, setNickname] = useState('');

  const connectWallet = useCallback(async () => {
    try {
      if (!primaryWallet) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Connect to Linera
      const provider = await lineraAdapter.connect(primaryWallet);
      
      if (provider) {
        setIsConnected(true);
        setAddress(provider.address);
        
        // Get balance from the contract
        try {
          const balanceResponse = await lineraAdapter.queryApplication({
            type: 'GetPlayerBalance',
            player: provider.address
          });
          setBalance(balanceResponse?.balance || 0);
        } catch (err) {
          console.log('Balance not available yet');
        }
        
        toast.success('Connected to game!');
      }
    } catch (error) {
      toast.error('Failed to connect to Linera');
      console.error(error);
    }
  }, [primaryWallet]);

  useEffect(() => {
    if (primaryWallet && !isConnected) {
      connectWallet();
    }
  }, [primaryWallet, isConnected, connectWallet]);

  useEffect(() => {
    if (user) {
      setNickname(user.username || '');
    }
  }, [user]);

  const setPlayerNickname = async (name: string) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'SetNickname',
          name
        }
      );
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
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'CreateMatch',
          room_name: roomName,
          password: password || null,
          mode: mode || 'Classic',
          stake: stake || null
        }
      );
      toast.success('Room created successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to create room');
      throw error;
    }
  };

  const joinRoom = async (roomId: number, password?: string) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'JoinGame',
          room_id: roomId,
          password: password || null
        }
      );
      toast.success('Joined room!');
      return result;
    } catch (error) {
      toast.error('Failed to join room');
      throw error;
    }
  };

  const makeMove = async (roomId: number, position: number) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'MakeMove',
          room_id: roomId,
          position
        }
      );
      return result;
    } catch (error) {
      toast.error('Move failed');
      throw error;
    }
  };

  const getLobby = async () => {
    try {
      const response = await lineraAdapter.queryApplication({ type: 'GetLobby' });
      return response || [];
    } catch (error) {
      toast.error('Failed to fetch lobby');
      return [];
    }
  };

  const getGameState = async (roomId: number) => {
    try {
      const response = await lineraAdapter.queryApplication({
        type: 'GetBoard',
        room_id: roomId
      });
      return response;
    } catch (error) {
      toast.error('Failed to fetch game state');
      return null;
    }
  };

  const createTournament = async (name: string, format: string, entryFee?: number, maxPlayers: number = 32) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'CreateTournament',
          name,
          format,
          entry_fee: entryFee || null,
          max_players: maxPlayers,
          prize_distribution: [50, 30, 20]
        }
      );
      toast.success('Tournament created!');
      return result;
    } catch (error) {
      toast.error('Failed to create tournament');
      throw error;
    }
  };

  const joinTournament = async (tournamentId: number) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'JoinTournament',
          tournament_id: tournamentId
        }
      );
      toast.success('Joined tournament!');
      return result;
    } catch (error) {
      toast.error('Failed to join tournament');
      throw error;
    }
  };

  const createGuild = async (name: string, tag: string) => {
    try {
      const result = await lineraAdapter.getProvider().client.executeOperation(
        lineraAdapter.getProvider().wallet,
        {
          type: 'CreateGuild',
          name,
          tag
        }
      );
      toast.success('Guild created!');
      return result;
    } catch (error) {
      toast.error('Failed to create guild');
      throw error;
    }
  };

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
    createGuild
  };
};