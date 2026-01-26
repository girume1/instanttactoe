import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Tournament, TournamentBracket, TournamentStatus } from '../types';
import { useTournament, TournamentData } from '../hooks/useTournament';

interface TournamentContextType {
  tournaments: Tournament[];
  myTournaments: Tournament[];
  currentTournament: Tournament | null;
  tournamentBracket: TournamentBracket | null;
  loading: boolean;
  
  fetchTournaments: (status?: string) => Promise<void>;
  createTournament: (
    name: string,
    format: string,
    entryFee?: number,
    maxPlayers?: number
  ) => Promise<Tournament | null>;
  joinTournament: (tournamentId: number) => Promise<boolean>;
  startTournament: (tournamentId: number) => Promise<boolean>;
  leaveTournament: (tournamentId: number) => Promise<boolean>;
  setCurrentTournament: (tournament: Tournament | null) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournamentContext must be used within TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentBracket, setTournamentBracket] = useState<TournamentBracket | null>(null);
  
  const {
    tournaments: tournamentData,
    loading,
    fetchTournaments,
    createTournament: createTournamentHook,
    joinTournament: joinTournamentHook,
    startTournament: startTournamentHook,
    getTournamentDetails,
    getTournamentBracket
  } = useTournament();

  // Convert TournamentData to Tournament type
  const tournaments: Tournament[] = tournamentData.map(data => ({
    id: data.id,
    name: data.name,
    format: data.format as any, // Assuming format matches TournamentFormat enum
    status: data.status as TournamentStatus,
    entryFee: data.entryFee,
    prizePool: data.prizePool,
    players: data.players,
    maxPlayers: data.maxPlayers,
    currentRound: data.currentRound
  }));

  const createTournament = useCallback(async (
    name: string,
    format: string,
    entryFee?: number,
    maxPlayers: number = 32
  ): Promise<Tournament | null> => {
    try {
      const result = await createTournamentHook(name, format, entryFee, maxPlayers);
      
      const newTournament: Tournament = {
        id: Date.now(),
        name,
        format: format as any,
        status: TournamentStatus.REGISTRATION,
        entryFee,
        prizePool: entryFee ? entryFee * maxPlayers : 0,
        players: [],
        maxPlayers,
        currentRound: 0
      };
      
      setMyTournaments(prev => [...prev, newTournament]);
      toast.success('Tournament created!');
      
      return newTournament;
    } catch (error) {
      toast.error('Failed to create tournament');
      return null;
    }
  }, [createTournamentHook]);

  const joinTournament = useCallback(async (tournamentId: number): Promise<boolean> => {
    try {
      const result = await joinTournamentHook(tournamentId);
      
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament && !myTournaments.some(t => t.id === tournamentId)) {
        setMyTournaments(prev => [...prev, tournament]);
      }
      
      toast.success('Joined tournament!');
      return true;
    } catch (error) {
      toast.error('Failed to join tournament');
      return false;
    }
  }, [joinTournamentHook, tournaments, myTournaments]);

  const startTournament = useCallback(async (tournamentId: number): Promise<boolean> => {
    try {
      const result = await startTournamentHook(tournamentId);
      
      setMyTournaments(prev =>
        prev.map(t =>
          t.id === tournamentId
            ? { ...t, status: TournamentStatus.IN_PROGRESS, currentRound: 1 }
            : t
        )
      );
      
      toast.success('Tournament started!');
      return true;
    } catch (error) {
      toast.error('Failed to start tournament');
      return false;
    }
  }, [startTournamentHook]);

  const leaveTournament = useCallback(async (tournamentId: number): Promise<boolean> => {
    try {
      setMyTournaments(prev => prev.filter(t => t.id !== tournamentId));
      toast('Left tournament');
      return true;
    } catch (error) {
      toast.error('Failed to leave tournament');
      return false;
    }
  }, []);

  const loadTournamentDetails = useCallback(async (tournamentId: number) => {
    try {
      const details = await getTournamentDetails(tournamentId);
      const bracket = await getTournamentBracket(tournamentId);
      
      if (details) {
        setCurrentTournament(details as Tournament);
      }
      if (bracket) {
        setTournamentBracket(bracket);
      }
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    }
  }, [getTournamentDetails, getTournamentBracket]);

  const value: TournamentContextType = {
    tournaments,
    myTournaments,
    currentTournament,
    tournamentBracket,
    loading,
    fetchTournaments,
    createTournament,
    joinTournament,
    startTournament,
    leaveTournament,
    setCurrentTournament: (tournament: Tournament | null) => {
      setCurrentTournament(tournament);
      if (tournament) {
        loadTournamentDetails(tournament.id);
      } else {
        setTournamentBracket(null);
      }
    }
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};