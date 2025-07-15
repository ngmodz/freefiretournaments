import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Tournament } from "@/lib/tournamentService";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import TournamentDetailsContent from "@/components/tournament-details";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Tournament ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    const tournamentRef = doc(db, "tournaments", id);

    const unsubscribeSnapshot = onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Tournament;
        console.log("Tournament data updated in real-time:", data);
        setTournament(data);
        if (currentUser) {
          setIsHost(data.host_id === currentUser.uid);
        }
      } else {
        console.error("Tournament not found");
        setError("Tournament not found");
        setTournament(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch tournament details:", err);
      setError(err.message || "Failed to load tournament details");
      setLoading(false);
      toast({
        title: "Error",
        description: err.message || "Failed to load tournament details",
        variant: "destructive",
      });
    });

    // Cleanup listener on unmount
    return () => unsubscribeSnapshot();
  }, [id, currentUser, toast]);

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
        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-gaming-primary shadow-glow" />
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
          onClick={() => window.location.reload()}
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
      userProfile={userProfile as any}
      onRefresh={() => { /* No longer needed, but prop can remain for now */ }}
    />
  );
};

export default TournamentDetails;
