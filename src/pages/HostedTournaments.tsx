import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/contexts/TournamentContext";
import { Tournament } from "@/lib/tournamentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, PlusCircle, Trash2, Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { cancelTournament } from "@/lib/tournamentService";

const HostedTournaments: React.FC = () => {
  const { currentUser } = useAuth();
  const { hostedTournaments, isLoadingHostedTournaments, refreshHostedTournaments } = useTournament();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      refreshHostedTournaments();
    }
  }, [currentUser, refreshHostedTournaments]);

  const handleCancelTournament = async (tournamentId: string) => {
    setIsCancelling(tournamentId);
    try {
      const result = await cancelTournament(tournamentId);
      toast({
        title: "Tournament Cancelled",
        description: result.message,
      });
      await refreshHostedTournaments();
    } catch (err) {
      toast({
        title: "Cancellation Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoadingHostedTournaments) {
    return <div>Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hosted Tournaments</h1>
        <Button asChild>
          <Link to="/tournaments/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Tournament
          </Link>
        </Button>
      </div>

      {hostedTournaments.length === 0 ? (
        <p>You have not hosted any tournaments yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hostedTournaments.map((tournament) => (
            <Card key={tournament.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{tournament.name}</span>
                  <Badge variant={tournament.status === 'active' ? 'secondary' : 'outline'}>
                    {tournament.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(tournament.start_date).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    {tournament.filled_spots} / {tournament.max_players} participants
                  </p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/tournaments/${tournament.id}`}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Link>
                  </Button>
                  {tournament.status === 'ongoing' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isCancelling === tournament.id}
                        >
                          <Ban className="mr-1 h-4 w-4" />
                          {isCancelling === tournament.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel the tournament and refund the entry fee to all
                            participants. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Back</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelTournament(tournament.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Cancel Tournament
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {/* Placeholder for future delete functionality */}
                  {['completed', 'cancelled'].includes(tournament.status) && (
                     <Button variant="ghost" size="sm" disabled>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                     </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostedTournaments;
