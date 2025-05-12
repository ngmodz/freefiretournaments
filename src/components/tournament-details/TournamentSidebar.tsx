import React, { useEffect, useState } from "react";
import { Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TournamentDetailsSidebarProps } from "./types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OrganizerData {
  name: string;
  verified: boolean;
  tournamentsHosted: number;
}

const TournamentSidebar: React.FC<TournamentDetailsSidebarProps> = ({
  tournament,
  progressPercentage,
  spotsLeft,
  onJoin
}) => {
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      if (!tournament.host_id) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", tournament.host_id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOrganizer({
            name: userData.displayName || userData.username || "Anonymous Organizer",
            verified: userData.verified || false,
            tournamentsHosted: userData.tournamentsHosted || 0
          });
        } else {
          setOrganizer({
            name: "Unknown Organizer",
            verified: false,
            tournamentsHosted: 0
          });
        }
      } catch (error) {
        console.error("Error fetching organizer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerData();
  }, [tournament.host_id]);

  return (
    <div className="space-y-6">
      <Card className="bg-gaming-card border-gaming-border p-4">
        <h3 className="font-semibold mb-4">Registration</h3>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gaming-muted">Entry Fee</div>
          <div className="font-bold text-lg">₹{tournament.entry_fee}</div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-gaming-muted">Prize Pool (Est.)</div>
          <div className="font-bold text-lg text-gaming-accent">₹{(tournament.entry_fee * tournament.max_players * 0.8).toFixed(2)}</div>
        </div>
        <Separator className="my-4" />
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <Users size={16} className="mr-1 text-gaming-muted" />
              <span className="text-gaming-muted">Participants</span>
            </div>
            <div className="font-medium">
              {tournament.filled_spots}/{tournament.max_players}
            </div>
          </div>
          <div className="w-full bg-gaming-border h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gaming-primary"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gaming-muted mt-1">
            {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Fully booked'}
          </div>
        </div>
        <Button 
          className="w-full bg-gaming-primary hover:bg-gaming-primary/90" 
          disabled={tournament.status !== 'active' || spotsLeft <= 0}
          onClick={onJoin}
        >
          {tournament.status !== 'active' ? `Registration ${tournament.status}` : spotsLeft <= 0 ? 'Tournament Full' : 'Join Tournament'}
        </Button>
      </Card>

      <Card className="bg-gaming-card border-gaming-border p-4">
        <h3 className="font-semibold mb-3">Organized By</h3>
        {loading ? (
          <div className="text-sm text-gaming-muted">Loading organizer info...</div>
        ) : organizer ? (
          <div className="flex items-center">
            <div>
              <div className="font-medium text-white">{organizer.name}</div>
              <div className="text-xs text-gaming-muted">{organizer.tournamentsHosted} tournaments hosted</div>
            </div>
            {organizer.verified && (
              <Check size={18} className="ml-auto text-gaming-primary" />
            )}
          </div>
        ) : (
          <div className="text-sm text-gaming-muted">No organizer information available</div>
        )}
      </Card>
    </div>
  );
};

export default TournamentSidebar;