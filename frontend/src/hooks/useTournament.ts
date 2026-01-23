import { useState, useCallback } from 'react';
import { lineraClient } from '../utils/linera';
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
  bracket?: TournamentBracket;
}

export interface TournamentBracket {
  matches: TournamentMatch[];
  rounds: number;
}

export interface TournamentMatch {
  id: number;
  player1?: string;
  player2?: string;
  winner?: string;
  round: number;
  nextMatchId?: number;
}

export const useTournament = () => {
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTournaments = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const query = status 
        ? { type: 'GetTournaments', status }
        : { type: 'GetTournaments' };
      
      const response = await lineraClient.query(query);
      setTournaments(response);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTournament = useCallback(async (
    name: string,
    format: string,
    entryFee?: number,
    maxPlayers: number = 32,
    prizeDistribution: number[] = [50, 30, 20]
  ) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'CreateTournament',
        name,
        format,
        entry_fee: entryFee || null,
        max_players: maxPlayers,
        prize_distribution: prizeDistribution
      });
      
      toast.success('Tournament created successfully!');
      return result;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast.error('Failed to create tournament');
      throw error;
    }
  }, []);

  const joinTournament = useCallback(async (tournamentId: number) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'JoinTournament',
        tournament_id: tournamentId
      });
      
      toast.success('Joined tournament!');
      return result;
    } catch (error) {
      console.error('Failed to join tournament:', error);
      toast.error('Failed to join tournament');
      throw error;
    }
  }, []);

  const startTournament = useCallback(async (tournamentId: number) => {
    try {
      const result = await lineraClient.executeOperation({
        type: 'StartTournament',
        tournament_id: tournamentId
      });
      
      toast.success('Tournament started!');
      return result;
    } catch (error) {
      console.error('Failed to start tournament:', error);
      toast.error('Failed to start tournament');
      throw error;
    }
  }, []);

  const reportMatchResult = useCallback(async (
    tournamentId: number,
    matchId: number,
    result: 'Win' | 'Loss' | 'Draw',
    player: string
  ) => {
    try {
      const matchResult = result === 'Win' ? 'Win' : result === 'Loss' ? 'Loss' : 'Draw';
      
      const opResult = await lineraClient.executeOperation({
        type: 'ReportMatchResult',
        tournament_id: tournamentId,
        match_id: matchId,
        result: matchResult
      });
      
      toast.success('Match result reported!');
      return opResult;
    } catch (error) {
      console.error('Failed to report match result:', error);
      toast.error('Failed to report match result');
      throw error;
    }
  }, []);

  const getTournamentDetails = useCallback(async (tournamentId: number) => {
    try {
      const response = await lineraClient.query({
        type: 'GetTournamentDetails',
        tournament_id: tournamentId
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch tournament details:', error);
      toast.error('Failed to load tournament details');
      return null;
    }
  }, []);

  const getTournamentBracket = useCallback(async (tournamentId: number) => {
    try {
      const response = await lineraClient.query({
        type: 'GetTournamentBracket',
        tournament_id: tournamentId
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch tournament bracket:', error);
      toast.error('Failed to load tournament bracket');
      return null;
    }
  }, []);

  return {
    tournaments,
    loading,
    fetchTournaments,
    createTournament,
    joinTournament,
    startTournament,
    reportMatchResult,
    getTournamentDetails,
    getTournamentBracket
  };
};