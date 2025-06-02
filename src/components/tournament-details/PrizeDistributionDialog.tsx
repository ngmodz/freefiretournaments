import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, User, Check, AlertCircle, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrizeDistributionService } from "@/lib/prizeDistributionService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PrizeDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: {
    id: string;
    name: string;
    prizePool: {
      totalPrizeCredits: number;
      prizeDistribution: { first: number; second: number; third: number };
      isDistributed: boolean;
      distributedAt?: any;
      distributedBy?: string;
      winners?: {
        first?: { uid: string; username: string; prizeCredits: number };
        second?: { uid: string; username: string; prizeCredits: number };
        third?: { uid: string; username: string; prizeCredits: number };
      };
    };
    participants?: string[];
  };
  hostUid: string;
  onSuccess?: () => void;
}

const PrizeDistributionDialog: React.FC<PrizeDistributionDialogProps> = ({
  open,
  onOpenChange,
  tournament,
  hostUid,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isDistributing, setIsDistributing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<{ [key: string]: boolean }>({});
  const [winners, setWinners] = useState<{
    first?: { uid: string; username: string };
    second?: { uid: string; username: string };
    third?: { uid: string; username: string };
  }>({});

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setWinners({});
      setErrors([]);
      setIsDistributing(false);
    }
  }, [open]);

  const validateWinners = () => {
    const newErrors: string[] = [];
    
    // Check if any winner is set
    if (!winners.first && !winners.second && !winners.third) {
      newErrors.push("Please select at least one winner");
    }
    
    // Check for duplicate winners
    const winnerIds = Object.values(winners)
      .filter(winner => winner?.uid)
      .map(winner => winner?.uid);
    
    if (winnerIds.length !== new Set(winnerIds).size) {
      newErrors.push("A player cannot win multiple positions");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const lookupUser = async (uid: string, position: 'first' | 'second' | 'third') => {
    if (!uid.trim()) {
      setWinners(prev => ({
        ...prev,
        [position]: undefined
      }));
      return;
    }

    setIsSearching(prev => ({ ...prev, [position]: true }));

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        toast({
          title: "User Not Found",
          description: `No user found with ID: ${uid}`,
          variant: "destructive"
        });
        return;
      }

      const userData = userDoc.data();
      const username = userData.username || userData.displayName || uid;

      setWinners(prev => ({
        ...prev,
        [position]: { uid, username }
      }));
    } catch (error) {
      console.error("Error looking up user:", error);
      toast({
        title: "Error",
        description: "Failed to lookup user information",
        variant: "destructive"
      });
    } finally {
      setIsSearching(prev => ({ ...prev, [position]: false }));
    }
  };

  const handleDistributePrizes = async () => {
    if (!validateWinners()) return;

    setIsDistributing(true);
    setErrors([]);

    try {
      const result = await PrizeDistributionService.distributeAllPrizes(
        tournament.id,
        winners,
        hostUid
      );

      if (result.success) {
        toast({
          title: "Prizes Distributed Successfully!",
          description: "All winners have received their prize credits.",
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrors(result.errors);
        toast({
          title: "Prize Distribution Failed",
          description: "Some prizes could not be distributed. Please check the errors.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error distributing prizes:', error);
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
      toast({
        title: "Distribution Error",
        description: "An error occurred while distributing prizes.",
        variant: "destructive"
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // If prizes already distributed, show a different UI
  if (tournament.prizePool.isDistributed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Prizes Already Distributed
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gaming-muted">
              Prizes for this tournament have already been distributed to the winners.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gaming-card border-gaming-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Distribute Tournament Prizes
          </DialogTitle>
          <DialogDescription>
            Award prizes to tournament winners
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Prize Pool Summary */}
          <div className="bg-gaming-bg/50 p-3 rounded-md">
            <h4 className="font-medium mb-2">Prize Pool: {tournament.prizePool.totalPrizeCredits} Credits</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>1st: {tournament.prizePool.prizeDistribution.first}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-gray-300" />
                <span>2nd: {tournament.prizePool.prizeDistribution.second}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-700" />
                <span>3rd: {tournament.prizePool.prizeDistribution.third}</span>
              </div>
            </div>
          </div>

          {/* First Place */}
          {tournament.prizePool.prizeDistribution.first > 0 && (
            <div>
              <Label htmlFor="firstPlaceWinner" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                First Place Winner
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="firstPlaceWinner"
                    placeholder="Enter player UID"
                    className="bg-gaming-bg text-white"
                    onChange={(e) => {
                      const uid = e.target.value;
                      if (uid === winners.first?.uid) return;
                      setWinners(prev => ({
                        ...prev,
                        first: uid ? { uid, username: '' } : undefined
                      }));
                    }}
                    onBlur={(e) => lookupUser(e.target.value, 'first')}
                  />
                  {isSearching.first && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.getElementById('firstPlaceWinner') as HTMLInputElement;
                    if (input && input.value) {
                      lookupUser(input.value, 'first');
                    }
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {winners.first?.username && (
                <p className="text-sm text-green-500 mt-1">
                  Found: {winners.first.username}
                </p>
              )}
            </div>
          )}

          {/* Second Place */}
          {tournament.prizePool.prizeDistribution.second > 0 && (
            <div>
              <Label htmlFor="secondPlaceWinner" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gray-300" />
                Second Place Winner
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="secondPlaceWinner"
                    placeholder="Enter player UID"
                    className="bg-gaming-bg text-white"
                    onChange={(e) => {
                      const uid = e.target.value;
                      if (uid === winners.second?.uid) return;
                      setWinners(prev => ({
                        ...prev,
                        second: uid ? { uid, username: '' } : undefined
                      }));
                    }}
                    onBlur={(e) => lookupUser(e.target.value, 'second')}
                  />
                  {isSearching.second && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.getElementById('secondPlaceWinner') as HTMLInputElement;
                    if (input && input.value) {
                      lookupUser(input.value, 'second');
                    }
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {winners.second?.username && (
                <p className="text-sm text-green-500 mt-1">
                  Found: {winners.second.username}
                </p>
              )}
            </div>
          )}

          {/* Third Place */}
          {tournament.prizePool.prizeDistribution.third > 0 && (
            <div>
              <Label htmlFor="thirdPlaceWinner" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-700" />
                Third Place Winner
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="thirdPlaceWinner"
                    placeholder="Enter player UID"
                    className="bg-gaming-bg text-white"
                    onChange={(e) => {
                      const uid = e.target.value;
                      if (uid === winners.third?.uid) return;
                      setWinners(prev => ({
                        ...prev,
                        third: uid ? { uid, username: '' } : undefined
                      }));
                    }}
                    onBlur={(e) => lookupUser(e.target.value, 'third')}
                  />
                  {isSearching.third && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.getElementById('thirdPlaceWinner') as HTMLInputElement;
                    if (input && input.value) {
                      lookupUser(input.value, 'third');
                    }
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {winners.third?.username && (
                <p className="text-sm text-green-500 mt-1">
                  Found: {winners.third.username}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDistributing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDistributePrizes}
            disabled={isDistributing}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {isDistributing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Distributing...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Distribute Prizes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeDistributionDialog; 