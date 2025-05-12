import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { getHostedTournaments, getTournaments, Tournament } from '@/lib/tournamentService';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface TournamentContextType {
  hostedTournaments: Tournament[];
  refreshHostedTournaments: () => Promise<void>;
  isLoadingHostedTournaments: boolean;
  joinedTournaments: Tournament[];
  refreshJoinedTournaments: () => Promise<void>;
  isLoadingJoinedTournaments: boolean;
}

// Create a default context with empty values to avoid null checks
const defaultContextValue: TournamentContextType = {
  hostedTournaments: [],
  refreshHostedTournaments: async () => {},
  isLoadingHostedTournaments: false,
  joinedTournaments: [],
  refreshJoinedTournaments: async () => {},
  isLoadingJoinedTournaments: false
};

const TournamentContext = createContext<TournamentContextType>(defaultContextValue);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [hostedTournaments, setHostedTournaments] = useState<Tournament[]>([]);
  const [isLoadingHostedTournaments, setIsLoadingHostedTournaments] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);
  const [isLoadingJoinedTournaments, setIsLoadingJoinedTournaments] = useState(false);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const loadingTimeoutRef = useRef<number | null>(null);
  const joinedLoadingTimeoutRef = useRef<number | null>(null);

  // Clear any existing timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (joinedLoadingTimeoutRef.current) {
        clearTimeout(joinedLoadingTimeoutRef.current);
      }
    };
  }, []);

  const refreshHostedTournaments = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingHostedTournaments(false);
      setHostedTournaments([]);
      return;
    }
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set a timeout to ensure loading state is eventually cleared
    // even if the request doesn't complete properly
    loadingTimeoutRef.current = window.setTimeout(() => {
      console.log("Loading timeout triggered - forcing loading state to false");
      setIsLoadingHostedTournaments(false);
      setHostedTournaments([]);
    }, 10000) as unknown as number; // 10 second timeout
    
    try {
      setIsLoadingHostedTournaments(true);
      const fetchedTournaments = await getHostedTournaments();
      
      // Clear the timeout since we got a response
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setHostedTournaments(Array.isArray(fetchedTournaments) ? fetchedTournaments : []);
    } catch (error) {
      console.error("Error fetching hosted tournaments:", error);
      toast({
        title: "Error loading tournaments",
        description: "There was a problem loading your hosted tournaments.",
        variant: "destructive"
      });
      // Set empty array on error to prevent using stale data
      setHostedTournaments([]);
    } finally {
      // Clear the timeout since we're done processing
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setIsLoadingHostedTournaments(false);
    }
  }, [currentUser, toast]);

  // Add functionality for joined tournaments
  const refreshJoinedTournaments = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingJoinedTournaments(false);
      setJoinedTournaments([]);
      return;
    }
    
    // Clear any existing timeout
    if (joinedLoadingTimeoutRef.current) {
      clearTimeout(joinedLoadingTimeoutRef.current);
    }
    
    // Set a timeout to ensure loading state is eventually cleared
    joinedLoadingTimeoutRef.current = window.setTimeout(() => {
      console.log("Joined tournaments loading timeout triggered - forcing loading state to false");
      setIsLoadingJoinedTournaments(false);
      setJoinedTournaments([]);
    }, 10000) as unknown as number; // 10 second timeout
    
    try {
      setIsLoadingJoinedTournaments(true);
      const allTournaments = await getTournaments();
      
      // Filter for tournaments where the current user is a participant
      const joined = allTournaments.filter(tournament => 
        tournament.participants && tournament.participants.includes(currentUser.uid)
      );
      
      // Clear the timeout since we got a response
      if (joinedLoadingTimeoutRef.current) {
        clearTimeout(joinedLoadingTimeoutRef.current);
        joinedLoadingTimeoutRef.current = null;
      }
      
      setJoinedTournaments(joined);
    } catch (error) {
      console.error("Error fetching joined tournaments:", error);
      toast({
        title: "Error loading tournaments",
        description: "There was a problem loading your joined tournaments.",
        variant: "destructive"
      });
      // Set empty array on error to prevent using stale data
      setJoinedTournaments([]);
    } finally {
      // Clear the timeout since we're done processing
      if (joinedLoadingTimeoutRef.current) {
        clearTimeout(joinedLoadingTimeoutRef.current);
        joinedLoadingTimeoutRef.current = null;
      }
      setIsLoadingJoinedTournaments(false);
    }
  }, [currentUser, toast]);

  // Load hosted and joined tournaments when the user changes
  useEffect(() => {
    if (currentUser) {
      refreshHostedTournaments().catch(err => {
        console.error("Failed to refresh hosted tournaments in useEffect:", err);
        setIsLoadingHostedTournaments(false);
        setHostedTournaments([]);
      });
      
      refreshJoinedTournaments().catch(err => {
        console.error("Failed to refresh joined tournaments in useEffect:", err);
        setIsLoadingJoinedTournaments(false);
        setJoinedTournaments([]);
      });
    } else {
      // Clear tournaments if no user is logged in
      setHostedTournaments([]);
      setIsLoadingHostedTournaments(false);
      setJoinedTournaments([]);
      setIsLoadingJoinedTournaments(false);
    }
  }, [currentUser, refreshHostedTournaments, refreshJoinedTournaments]);

  const value = {
    hostedTournaments,
    refreshHostedTournaments,
    isLoadingHostedTournaments,
    joinedTournaments,
    refreshJoinedTournaments,
    isLoadingJoinedTournaments
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  return context;
}; 