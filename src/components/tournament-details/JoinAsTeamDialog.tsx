import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Trash2, AlertTriangle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Tournament } from "@/lib/tournamentService";
import { useNavigate } from "react-router-dom";
import { getTeamSizeForMode, validateDuoTeam } from "@/lib/teamService";

interface TeamMember {
  ign: string;
  uid: string;
}

interface JoinAsTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | null;
  onConfirm: (teamData: { name: string; tag: string; members: TeamMember[] }) => Promise<void>;
  isJoining: boolean;
}

const JoinAsTeamDialog: React.FC<JoinAsTeamDialogProps> = ({
  open,
  onOpenChange,
  tournament,
  onConfirm,
  isJoining
}) => {
  const { currentUser } = useAuth();
  const { tournamentCredits, isLoading: isCreditsLoading } = useCreditBalance(currentUser?.uid);
  const navigate = useNavigate();

  // Team form state
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([{ ign: "", uid: "" }]);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setTeamName("");
      setTeamTag("");
      setMembers([{ ign: "", uid: "" }]);
      setErrors([]);
    }
  }, [open]);

  if (!tournament) {
    return null;
  }

  const entryFee = tournament.entry_fee || 0;
  const hasInsufficientCredits = !isCreditsLoading && tournamentCredits < entryFee;
  const teamSizeRequirements = getTeamSizeForMode(tournament.mode);
  const currentTeamSize = members.length + 1; // +1 for leader
  const isDuoMode = tournament.mode === 'Duo';

  // Validate form
  const validateForm = () => {
    const newErrors: string[] = [];

    if (!teamName.trim()) {
      newErrors.push("Team name is required");
    } else if (teamName.trim().length < 3) {
      newErrors.push("Team name must be at least 3 characters");
    }

    if (!teamTag.trim()) {
      newErrors.push("Team tag is required");
    } else if (teamTag.trim().length < 2 || teamTag.trim().length > 5) {
      newErrors.push("Team tag must be 2-5 characters");
    }

    // Validate team size
    if (currentTeamSize < teamSizeRequirements.min) {
      newErrors.push(`${tournament.mode} tournaments require at least ${teamSizeRequirements.min} players`);
    } else if (currentTeamSize > teamSizeRequirements.max) {
      newErrors.push(`${tournament.mode} tournaments allow maximum ${teamSizeRequirements.max} players`);
    }

    // Validate each member
    members.forEach((member, index) => {
      if (!member.ign.trim()) {
        newErrors.push(`Member ${index + 1}: IGN is required`);
      } else if (member.ign.trim().length < 3) {
        newErrors.push(`Member ${index + 1}: IGN must be at least 3 characters`);
      }

      if (!member.uid.trim()) {
        newErrors.push(`Member ${index + 1}: UID is required`);
      } else if (!/^[0-9]{8,12}$/.test(member.uid.trim())) {
        newErrors.push(`Member ${index + 1}: UID must be 8-12 digits`);
      }
    });

    // Check for duplicate UIDs
    const uids = members.map(m => m.uid.trim()).filter(uid => uid);
    const duplicateUids = uids.filter((uid, index) => uids.indexOf(uid) !== index);
    if (duplicateUids.length > 0) {
      newErrors.push("Duplicate UIDs found. Each player must have a unique UID");
    }

    // Check for duplicate IGNs
    const igns = members.map(m => m.ign.trim()).filter(ign => ign);
    const duplicateIgns = igns.filter((ign, index) => igns.indexOf(ign) !== index);
    if (duplicateIgns.length > 0) {
      newErrors.push("Duplicate IGNs found. Each player must have a unique IGN");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addMember = () => {
    if (currentTeamSize < teamSizeRequirements.max) {
      setMembers([...members, { ign: "", uid: "" }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const teamData = {
      name: teamName.trim(),
      tag: teamTag.trim().toUpperCase(),
      members: members.map(member => ({
        ign: member.ign.trim(),
        uid: member.uid.trim()
      }))
    };

    await onConfirm(teamData);
  };

  // If user has insufficient credits, show insufficient credits overlay
  if (open && hasInsufficientCredits) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Insufficient Credits
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="bg-red-100 border border-red-300 text-red-700">
            <AlertDescription>
              You need {entryFee} Tournament Credits to join this tournament as a team leader. 
              You currently have {tournamentCredits} credits.
            </AlertDescription>
          </Alert>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gaming-card border-gaming-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gaming-primary" />
            Join as Team - {tournament.name}
          </DialogTitle>
          <DialogDescription>
            Create your team and join the tournament. As team leader, you'll pay the full entry fee 
            ({entryFee} credits) and receive all winnings.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
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
          {/* Team Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="bg-gaming-bg text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamTag">Team Tag *</Label>
              <Input
                id="teamTag"
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                placeholder="TAG"
                maxLength={5}
                className="bg-gaming-bg text-white"
              />
            </div>
          </div>

          {/* Team Size Info */}
          <div className="bg-gaming-bg/30 p-3 rounded-md border border-gaming-border/30">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gaming-primary" />
              <span className="text-gaming-muted">
                {tournament.mode} tournament: {teamSizeRequirements.min === teamSizeRequirements.max 
                  ? `Exactly ${teamSizeRequirements.max} players required`
                  : `${teamSizeRequirements.min}-${teamSizeRequirements.max} players required`
                }
              </span>
            </div>
            <div className="text-xs text-gaming-muted mt-1">
              Current team size: {currentTeamSize} (including you as leader)
            </div>
          </div>

          {/* Duo-specific help text */}
          {isDuoMode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Duo Team Requirements
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• <strong>You (Team Leader):</strong> Pay entry fee and receive all winnings</p>
                    <p>• <strong>Your Teammate:</strong> Must be a registered Free Fire player</p>
                    <p>• <strong>Team Size:</strong> Exactly 2 players (you + 1 teammate)</p>
                    <p>• <strong>Entry:</strong> Only you need tournament credits to join</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                {isDuoMode ? 'Your Teammate' : 'Team Members'}
              </Label>
              {currentTeamSize < teamSizeRequirements.max && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  className="border-gaming-primary text-gaming-primary hover:bg-gaming-primary hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isDuoMode ? 'Add Teammate' : 'Add Member'}
                </Button>
              )}
            </div>

            {members.map((member, index) => (
              <div key={index} className="bg-gaming-bg/20 p-4 rounded-md border border-gaming-border/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gaming-muted">
                    {isDuoMode ? 'Your Teammate' : `Member ${index + 1}`}
                  </span>
                  {members.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`member-${index}-ign`} className="text-xs">IGN *</Label>
                    <Input
                      id={`member-${index}-ign`}
                      value={member.ign}
                      onChange={(e) => updateMember(index, 'ign', e.target.value)}
                      placeholder="In-game name"
                      className="bg-gaming-bg text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`member-${index}-uid`} className="text-xs">UID *</Label>
                    <Input
                      id={`member-${index}-uid`}
                      value={member.uid}
                      onChange={(e) => updateMember(index, 'uid', e.target.value)}
                      placeholder="Free Fire UID"
                      className="bg-gaming-bg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Entry Fee Info */}
          <div className="bg-gaming-bg/30 p-3 rounded-md border border-gaming-border/30">
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gaming-muted">Entry Fee:</span>
                <span className="font-medium">{entryFee} Credits</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gaming-muted">Your Balance:</span>
                <span className="font-medium">{tournamentCredits} Credits</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={isJoining}
            className="border-gaming-border text-gaming-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isJoining || isCreditsLoading || errors.length > 0}
            className="bg-gaming-primary hover:bg-gaming-secondary text-white"
          >
            {isJoining ? 'Joining...' : `Join Tournament (${entryFee} Credits)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinAsTeamDialog;