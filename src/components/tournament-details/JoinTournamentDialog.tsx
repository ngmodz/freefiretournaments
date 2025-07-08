import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Tournament } from "@/lib/tournamentService";
import { useNavigate } from "react-router-dom";

interface JoinTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | null;
  onConfirm: () => Promise<void>;
  isJoining: boolean;
}

const JoinTournamentDialog: React.FC<JoinTournamentDialogProps> = ({
  open,
  onOpenChange,
  tournament,
  onConfirm,
  isJoining
}) => {
  const { currentUser } = useAuth();
  const { tournamentCredits, isLoading: isCreditsLoading } = useCreditBalance(currentUser?.uid);
  const navigate = useNavigate();

  if (!tournament) {
    return null;
  }

  const entryFee = tournament.entry_fee || 0;
  const hasInsufficientCredits = !isCreditsLoading && tournamentCredits < entryFee;

  // If user has insufficient credits, only render the insufficient credits overlay
  if (open && hasInsufficientCredits) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-black/50 absolute inset-0" onClick={() => onOpenChange(false)}></div>
        <div className="bg-gaming-card border border-gaming-border rounded-lg p-6 max-w-md w-full mx-4 relative z-10">
          <Alert
            variant="destructive"
            className="bg-red-100 border border-red-300 text-red-700"
            style={{
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              minHeight: 'unset',
              boxShadow: 'none',
              display: 'block',
            }}
          >
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-4 w-4 text-red-400 mb-1" />
              <AlertTitle className="text-base font-semibold mb-1 text-center w-full">Insufficient Credits</AlertTitle>
            </div>
            <AlertDescription className="text-sm font-normal leading-tight text-left w-full mt-1">
              You need to add Tournament Credits before joining this tournament. You currently have {tournamentCredits} credits but need {entryFee} credits.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2 justify-center">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-gaming-primary text-gaming-primary"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate('/credits');
              }}
              className="bg-gaming-accent hover:bg-gaming-accent/90 text-white"
            >
              Buy Credits
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the normal AlertDialog
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Joining Tournament</AlertDialogTitle>
          <AlertDialogDescription>
            Joining <b>{tournament.name}</b> will cost <b>{entryFee} Tournament Credits</b>.<br />
            {isCreditsLoading ? 'Checking your balance...' : `You currently have ${tournamentCredits} Tournament Credit${tournamentCredits !== 1 ? 's' : ''}.`}
            <br />Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isJoining}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            disabled={isJoining || isCreditsLoading} 
            onClick={onConfirm}
          >
            {isJoining ? 'Joining...' : 'Yes, Join Tournament'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default JoinTournamentDialog; 