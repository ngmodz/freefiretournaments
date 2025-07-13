import React, { useState } from 'react';
import { Trophy, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tournament } from '@/lib/tournamentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Winner {
  position: string;
  uid: string;
  ign: string;
  prizeAmount: number;
}

interface PrizeDistributionFormProps {
  tournament: Tournament;
  onWinnersUpdated?: (tournament: Tournament) => void;
  className?: string;
}

const PrizeDistributionForm: React.FC<PrizeDistributionFormProps> = ({
  tournament,
  onWinnersUpdated,
  className = ""
}) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Calculate prize amounts based on tournament's prize distribution
  const calculatePrizeAmount = (position: string): number => {
    // Use currentPrizePool if available, otherwise fall back to calculation
    const totalPrizePool = tournament.currentPrizePool !== undefined 
      ? tournament.currentPrizePool 
      : tournament.entry_fee * tournament.filled_spots;
    const percentage = tournament.prize_distribution[position] || 0;
    return Math.floor((percentage / 100) * totalPrizePool);
  };

  const addWinner = () => {
    const position = `${winners.length + 1}`;
    const prizeAmount = calculatePrizeAmount(position);
    
    setWinners([...winners, {
      position,
      uid: '',
      ign: '',
      prizeAmount
    }]);
  };

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const updateWinner = (index: number, field: keyof Winner, value: string) => {
    const updatedWinners = [...winners];
    if (field === 'prizeAmount') {
      updatedWinners[index][field] = parseInt(value) || 0;
    } else {
      updatedWinners[index][field] = value;
    }
    setWinners(updatedWinners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (winners.length === 0) {
      toast({
        title: "No Winners",
        description: "Please add at least one winner before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validate winners
    const invalidWinners = winners.filter(w => !w.uid.trim() || !w.ign.trim());
    if (invalidWinners.length > 0) {
      toast({
        title: "Invalid Winners",
        description: "Please fill in all winner details (UID and IGN).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const winnersData = winners.reduce((acc, winner) => {
        acc[winner.position] = {
          uid: winner.uid,
          ign: winner.ign
        };
        return acc;
      }, {} as Record<string, { uid: string; ign: string }>);

      // Update tournament with winners and mark as completed
      const docRef = doc(db, "tournaments", tournament.id);
      await updateDoc(docRef, { 
        winners: winnersData,
        status: "completed",
        completed_at: serverTimestamp()
      });

      toast({
        title: "Winners Updated!",
        description: "Prize distribution has been saved successfully.",
      });
      
      if (onWinnersUpdated) {
        onWinnersUpdated({
          ...tournament,
          winners: winnersData,
          status: "completed"
        });
      }
    } catch (error) {
      console.error('Error updating winners:', error);
      toast({
        title: "Failed to Update Winners",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show form if tournament is ended
  if (tournament.status !== "ended") {
    return null;
  }

  return (
    <Card className={`bg-gaming-card border-gaming-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="text-gaming-accent" size={20} />
          Prize Distribution
        </CardTitle>
        <CardDescription className="text-gaming-muted">
          Enter the winners and their details to distribute prizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {winners.map((winner, index) => (
            <div key={index} className="p-4 bg-gaming-secondary/20 rounded-lg border border-gaming-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gaming-accent font-semibold">
                  Position {winner.position} - {winner.prizeAmount} credits
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWinner(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`uid-${index}`} className="text-gaming-muted">
                    Player UID
                  </Label>
                  <Input
                    id={`uid-${index}`}
                    type="text"
                    value={winner.uid}
                    onChange={(e) => updateWinner(index, 'uid', e.target.value)}
                    placeholder="Enter player UID"
                    className="bg-gaming-input border-gaming-border text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`ign-${index}`} className="text-gaming-muted">
                    In-Game Name (IGN)
                  </Label>
                  <Input
                    id={`ign-${index}`}
                    type="text"
                    value={winner.ign}
                    onChange={(e) => updateWinner(index, 'ign', e.target.value)}
                    placeholder="Enter IGN"
                    className="bg-gaming-input border-gaming-border text-white"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addWinner}
              className="flex items-center gap-2 border-gaming-border text-gaming-accent hover:bg-gaming-accent/10"
            >
              <Plus size={16} />
              Add Winner
            </Button>
            
            {winners.length > 0 && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gaming-accent hover:bg-gaming-accent/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Winners
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PrizeDistributionForm;
