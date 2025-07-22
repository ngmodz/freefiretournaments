import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, User, Check, AlertCircle, Search } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { PrizeDistributionService } from "@/lib/prizeDistributionService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { TeamParticipant } from "@/lib/types";

interface PrizeDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: {
    id: string;
    name: string;
    mode: "Solo" | "Duo" | "Squad";
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
    participants?: (string | TeamParticipant)[];
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
  console.log('🔥 PrizeDistributionDialog RENDERED', { open, tournament: tournament.id });
  
  const { toast } = useToast();
  const [isDistributing, setIsDistributing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<{ [key: string]: boolean }>({});
  const [winners, setWinners] = useState<{
    first?: { uid: string; username: string };
    second?: { uid: string; username: string };
    third?: { uid: string; username: string };
  }>({});
  const [inputValues, setInputValues] = useState<{
    first: string;
    second: string;
    third: string;
  }>({ first: '', second: '', third: '' });
  const [duplicateErrors, setDuplicateErrors] = useState<{
    first: boolean;
    second: boolean;
    third: boolean;
  }>({ first: false, second: false, third: false });

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setWinners({});
      setErrors([]);
      setInputValues({ first: '', second: '', third: '' });
      setDuplicateErrors({ first: false, second: false, third: false });
      setIsDistributing(false);
    }
  }, [open]);

  // Function to check for duplicates and update errors immediately
  const validateAndUpdateInput = (position: 'first' | 'second' | 'third', uid: string) => {
    console.log('✅ validateAndUpdateInput called:', { position, uid });
    
    // Update input values
    const newInputValues = { ...inputValues, [position]: uid };
    setInputValues(newInputValues);
    
    // Check for duplicates
    const allUids = Object.values(newInputValues).filter(v => v.trim() !== '');
    const uniqueUids = new Set(allUids);
    const hasDuplicates = allUids.length !== uniqueUids.size;
    
    console.log('🔍 Duplicate check:', { allUids, hasDuplicates });
    
    if (hasDuplicates && uid.trim()) {
      console.log('🚨 DUPLICATES DETECTED!!!');
      // Find which positions have duplicates
      const newDuplicateErrors = { first: false, second: false, third: false };
      
      Object.entries(newInputValues).forEach(([pos, value]) => {
        if (value.trim()) {
          const otherPositions = Object.entries(newInputValues).filter(([otherPos]) => otherPos !== pos);
          const isDuplicate = otherPositions.some(([_, otherValue]) => otherValue.trim() === value.trim());
          newDuplicateErrors[pos as 'first' | 'second' | 'third'] = isDuplicate;
        }
      });
      
      setDuplicateErrors(newDuplicateErrors);
      setErrors(['This UID is already used for another position. Each player can only win one position.']);
    } else {
      console.log('✅ No duplicates, clearing errors');
      setDuplicateErrors({ first: false, second: false, third: false });
      setErrors([]);
    }
    
    // Update winners state
    setWinners(prev => ({
      ...prev,
      [position]: uid ? { uid, username: '' } : undefined
    }));
  };

  // Helper function to check if a position has errors
  const hasPositionError = (position: 'first' | 'second' | 'third') => {
    return duplicateErrors[position] || errors.some(error => 
      error.includes(position) || 
      (position === 'first' && error.includes('1st')) || 
      (position === 'second' && error.includes('2nd')) || 
      (position === 'third' && error.includes('3rd')) ||
      error.includes('already used for another position')
    );
  };

  const validateWinners = () => {
    const newErrors: string[] = [];
    
    // Check if any winner is set
    if (!winners.first && !winners.second && !winners.third) {
      newErrors.push("Please select at least one winner");
    }
    
    // Get all winners that have both UID and username
    const completeWinners = Object.entries(winners)
      .filter(([_, winner]) => winner?.uid && winner?.username)
      .map(([position, winner]) => ({ position, ...winner! }));
    
    // Check for duplicate UIDs
    const uids = completeWinners.map(w => w.uid);
    const duplicateUids = uids.filter((uid, index) => uids.indexOf(uid) !== index);
    if (duplicateUids.length > 0) {
      newErrors.push("A player cannot win multiple positions (duplicate UID found)");
    }
    
    // Check for duplicate UID+username combinations
    const combinations = completeWinners.map(w => `${w.uid}-${w.username}`);
    const duplicateCombinations = combinations.filter((combo, index) => combinations.indexOf(combo) !== index);
    if (duplicateCombinations.length > 0) {
      newErrors.push("The same UID and username combination cannot be used for multiple positions");
    }
    
    // Check for incomplete entries (UID without username lookup)
    const incompleteEntries = Object.entries(winners)
      .filter(([_, winner]) => winner?.uid && !winner?.username);
    if (incompleteEntries.length > 0) {
      newErrors.push("Please wait for user lookup to complete for all entries");
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
      setInputValues(prev => ({ ...prev, [position]: '' }));
      return;
    }

    // Don't lookup if there's a duplicate error
    if (duplicateErrors[position]) {
      return;
    }

    setIsSearching(prev => ({ ...prev, [position]: true }));

    try {
      // For team tournaments, validate that the UID is a team leader
      if (tournament.mode !== 'Solo') {
        const teamParticipants = (tournament.participants || []).filter(p => typeof p === 'object' && 'teamId' in p) as TeamParticipant[];
        const isTeamLeader = teamParticipants.some(team => team.leaderId === uid);
        if (!isTeamLeader) {
          toast({
            title: "Invalid UID",
            description: "The entered UID does not belong to a team leader in this tournament.",
            variant: "destructive"
          });
          return;
        }
      }

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

      // Set the winner with username
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
    console.log('Prizes already distributed, showing read-only UI');
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

  console.log('Tournament prize pool:', tournament.prizePool);
  console.log('Is distributed?', tournament.prizePool.isDistributed);
  console.log('Winners:', tournament.prizePool.winners);

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
                First Place {tournament.mode !== 'Solo' ? 'Team Leader' : 'Winner'}
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="firstPlaceWinner"
                    value={inputValues.first}
                    placeholder={tournament.mode !== 'Solo' ? "Enter team leader UID" : "Enter player UID"}
                    className={`bg-gaming-bg text-white ${hasPositionError('first') ? 'border-red-500 focus:border-red-500' : ''}`}
                    onChange={(e) => {
                      const uid = e.target.value;
                      console.log('🚨 FIRST PLACE INPUT CHANGED:', uid);
                      validateAndUpdateInput('first', uid);
                    }}
                    onBlur={(e) => {
                      const uid = e.target.value.trim();
                      if (uid && !duplicateErrors.first) {
                        lookupUser(uid, 'first');
                      }
                    }}
                  />
                  {isSearching.first && (
                    <LoadingSpinner size="xs" className="absolute right-3 top-3" />
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
              {duplicateErrors.first && (
                <p className="text-sm text-red-500 mt-1 font-bold">
                  ⚠️ DUPLICATE UID DETECTED!
                </p>
              )}
            </div>
          )}

          {/* Second Place */}
          {tournament.prizePool.prizeDistribution.second > 0 && (
            <div>
              <Label htmlFor="secondPlaceWinner" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gray-300" />
                Second Place {tournament.mode !== 'Solo' ? 'Team Leader' : 'Winner'}
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="secondPlaceWinner"
                    value={inputValues.second}
                    placeholder={tournament.mode !== 'Solo' ? "Enter team leader UID" : "Enter player UID"}
                    className={`bg-gaming-bg text-white ${hasPositionError('second') ? 'border-red-500 focus:border-red-500' : ''}`}
                    onChange={(e) => {
                      const uid = e.target.value;
                      console.log('🚨 SECOND PLACE INPUT CHANGED:', uid);
                      validateAndUpdateInput('second', uid);
                    }}
                    onBlur={(e) => {
                      const uid = e.target.value.trim();
                      if (uid && !duplicateErrors.second) {
                        lookupUser(uid, 'second');
                      }
                    }}
                  />
                  {isSearching.second && (
                    <LoadingSpinner size="xs" className="absolute right-3 top-3" />
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
              {duplicateErrors.second && (
                <p className="text-sm text-red-500 mt-1 font-bold">
                  ⚠️ DUPLICATE UID DETECTED!
                </p>
              )}
            </div>
          )}

          {/* Third Place */}
          {tournament.prizePool.prizeDistribution.third > 0 && (
            <div>
              <Label htmlFor="thirdPlaceWinner" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-700" />
                Third Place {tournament.mode !== 'Solo' ? 'Team Leader' : 'Winner'}
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="thirdPlaceWinner"
                    value={inputValues.third}
                    placeholder={tournament.mode !== 'Solo' ? "Enter team leader UID" : "Enter player UID"}
                    className={`bg-gaming-bg text-white ${hasPositionError('third') ? 'border-red-500 focus:border-red-500' : ''}`}
                    onChange={(e) => {
                      const uid = e.target.value;
                      validateAndUpdateInput('third', uid);
                    }}
                    onBlur={(e) => {
                      const uid = e.target.value.trim();
                      if (uid && !duplicateErrors.third) {
                        lookupUser(uid, 'third');
                      }
                    }}
                  />
                  {isSearching.third && (
                    <LoadingSpinner size="xs" className="absolute right-3 top-3" />
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
              {duplicateErrors.third && (
                <p className="text-sm text-red-500 mt-1 font-bold">
                  ⚠️ DUPLICATE UID DETECTED!
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
            disabled={isDistributing || errors.length > 0}
            className="bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDistributing ? (
              <>
                <LoadingSpinner size="xs" className="mr-2" />
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