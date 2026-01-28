import { useState, useCallback } from 'react';
import { lineraAdapter } from '../utils/linera-adapter';
import toast from 'react-hot-toast';

export interface TournamentData {
  id: number;
  name: string;
  format: string;
  status: 'Registration' | 'InProgress' | 'Completed';
  entryFee?: number;
  prizePool: number;
  players: string[];
  maxPlayers: number;
  currentRound: number;
}

export const useTournament = () => {
  const [loading, setLoading] = useState(false);

  const fetchTournaments = useCallback(async (status?: string): Promise<TournamentData[]> => {
    setLoading(true);
    try {
      const res: any = await lineraAdapter.queryApplication({
        type: 'GetTournaments',
        status
      });

      return Array.isArray(res) ? (res as TournamentData[]) : [];
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      toast.error('Failed to load tournaments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTournament = useCallback(async (
    name: string,
    format: string,
    entryFee?: number,
    maxPlayers: number = 32
  ) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'CreateTournament',
        name,
        format,
        entry_fee: entryFee || null,
        max_players: maxPlayers,
        prize_distribution: [50, 30, 20]
      });
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create tournament');
    }
  }, []);

  const joinTournament = useCallback(async (tournamentId: number) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'JoinTournament',
        tournament_id: tournamentId
      });
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to join tournament');
    }
  }, []);

  const startTournament = useCallback(async (tournamentId: number) => {
    try {
      const result = await lineraAdapter.executeOperation({
        type: 'StartTournament',
        tournament_id: tournamentId
      });
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to start tournament');
    }
  }, []);

  const getTournamentDetails = useCallback(async (tournamentId: number) => {
    try {
      const response = await lineraAdapter.queryApplication({
        type: 'GetTournamentDetails',
        tournament_id: tournamentId
      });
      
      return response;
    } catch (error) {
      console.error('Failed to fetch tournament details:', error);
      return null;
    }
  }, []);

  return {
    loading,
    fetchTournaments,
    createTournament,
    joinTournament,
    startTournament,
    getTournamentDetails
  };
};