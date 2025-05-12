import React from "react";
import { Calendar, Clock, Trophy, Check, Edit3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentHeaderProps } from "./types";
import { cn } from "@/lib/utils";

const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  tournament,
  isHost,
  onSetRoomDetails
}) => {
  // Mock organizer data
  const mockOrganizer = {
    name: "GamersHub",
    verified: true,
    tournaments: 45
  };

  // Format date and time
  const startDate = new Date(tournament.start_date);
  const formattedDate = startDate.toLocaleDateString();
  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate prize pool (example calculation)
  const prizePool = tournament.entry_fee * tournament.max_players;

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-gaming-accent"; // Orange for ongoing/live tournaments
      case "active": return "bg-blue-500"; // Blue for active/upcoming tournaments
      case "cancelled": return "bg-[#505050]"; // Gray for cancelled tournaments
      case "completed": return "bg-[#505050]"; // Gray for completed tournaments
      default: return "bg-[#505050]";
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#1F2133] border border-[#333333] rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
          <div className="flex-grow">
            {/* Status badge */}
            <div className="flex items-center mb-3">
              <div className={cn(
                "text-white text-xs px-2 py-1 rounded-md inline-flex items-center",
                getStatusColor(tournament.status)
              )}>
                {tournament.status === "ongoing" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
                )}
                {tournament.status.toUpperCase()}
              </div>
              
              {/* Organizer badge */}
              <div className="flex items-center ml-2 bg-[#1A1A1A] px-2 py-1 rounded-md">
                <span className="text-[#E0E0E0] text-xs">By {mockOrganizer.name}</span>
                {mockOrganizer.verified && (
                  <Check size={14} className="ml-1 text-gaming-primary" />
                )}
              </div>
            </div>
            
            {/* Tournament name */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{tournament.name}</h1>
          </div>
          
          {/* Action button for host */}
          {isHost && (
            <Button 
              onClick={onSetRoomDetails} 
              size="sm" 
              className="mt-3 sm:mt-0 bg-gaming-accent hover:bg-gaming-accent/90 text-white"
            >
              <Edit3 size={16} className="mr-1.5" />
              Set Room Details
            </Button>
          )}
        </div>
        
        {/* Tournament details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Prize pool */}
          <div className="bg-[#1A1A1A] p-3 rounded-md">
            <div className="text-[#A0A0A0] text-xs mb-1">Prize Pool</div>
            <div className="flex items-center">
              <Trophy size={18} className="mr-2 text-gaming-accent" />
              <span className="text-gaming-accent font-bold text-lg">₹{prizePool}</span>
            </div>
          </div>
          
          {/* Entry fee */}
          <div className="bg-[#1A1A1A] p-3 rounded-md">
            <div className="text-[#A0A0A0] text-xs mb-1">Entry Fee</div>
            <div className="text-[#D0D0D0] font-bold text-lg">₹{tournament.entry_fee}</div>
          </div>
          
          {/* Start date and time */}
          <div className="bg-[#1A1A1A] p-3 rounded-md">
            <div className="text-[#A0A0A0] text-xs mb-1">Start Date & Time</div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{formattedDate}</span>
              <Clock size={16} className="ml-3 mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{formattedTime}</span>
            </div>
          </div>
          
          {/* Mode and max players */}
          <div className="bg-[#1A1A1A] p-3 rounded-md">
            <div className="text-[#A0A0A0] text-xs mb-1">Mode & Players</div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{tournament.mode} | Max: {tournament.max_players}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader; 