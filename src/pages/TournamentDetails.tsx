import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTournamentById, Tournament } from "@/lib/tournamentService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import TournamentDetailsContent from "@/components/tournament-details";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchTournamentDetails = async () => {
    if (!id) {
      setError("Tournament ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching tournament details for ID:", id);
      const data = await getTournamentById(id);
      
      if (!data) {
        console.error("Tournament not found");
        setError("Tournament not found");
        setTournament(null);
        return;
      }
      
      // Validate tournament data
      if (!data.name || !data.host_id) {
        console.error("Invalid tournament data:", data);
        setError("Tournament data is invalid");
        return;
      }
      
      console.log("Tournament data loaded successfully:", data);
      setTournament(data);
      
      if (currentUser) {
        setIsHost(data.host_id === currentUser.uid);
      }
    } catch (error) {
      console.error("Failed to fetch tournament details:", error);
      setError(error instanceof Error ? error.message : "Failed to load tournament details");
      
      // Show an error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load tournament details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  // Update isHost when either tournament or currentUser changes
  useEffect(() => {
    if (tournament && currentUser) {
      setIsHost(tournament.host_id === currentUser.uid);
    }
  }, [tournament, currentUser]);

  // Handle missing tournament ID
  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl font-semibold text-red-500">Invalid tournament page</p>
        <button 
          onClick={() => navigate('/home')}
          className="mt-4 bg-gaming-primary text-white px-4 py-2 rounded"
        >
          Go back to tournaments
        </button>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-gaming-primary" />
        <p className="ml-4 text-lg">Loading tournament details...</p>
      </div>
    );
  }

  // Show error state
  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl font-semibold text-red-500">{error || "Tournament not found"}</p>
        <button 
          onClick={() => navigate('/home')}
          className="mt-4 bg-gaming-primary text-white px-4 py-2 rounded"
        >
          Go back to tournaments
        </button>
        <button 
          onClick={fetchTournamentDetails}
          className="mt-2 border border-gaming-primary text-gaming-primary px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <TournamentDetailsContent
      id={id}
      tournament={tournament}
      isHost={isHost}
      loading={loading}
      currentUser={currentUser}
      onRefresh={fetchTournamentDetails}
    />
  );
};

export default TournamentDetails;
