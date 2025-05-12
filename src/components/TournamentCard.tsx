import { Calendar, Clock, Users, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TournamentType, TournamentStatus } from "@/components/home/types";
import { format, parseISO } from 'date-fns';
import { joinTournament } from "@/lib/tournamentService";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Array of banner images to randomly assign to tournaments
const bannerImages = [
  "https://iili.io/3v8Y6nS.jpg", // photo 1627856013091
  "https://iili.io/3v8Yrt2.jpg", // photo 1598550476439
  "https://iili.io/3v8YUu4.jpg", // photo 1563089145
  "https://iili.io/3v8Yv8G.jpg", // photo 1560253023
  "https://iili.io/3v8Ykas.jpg", // photo 1542751371
  "https://iili.io/3v8YN6X.jpg", // photo 1511512578047
  "https://iili.io/3v8YjnI.jpg", // photo 1511882150382
  "https://iili.io/3v8YXZN.jpg", // photo 1550745165
  "https://iili.io/3v8YWjp.jpg", // photo 1616588589676
  "https://iili.io/3v8YVuR.jpg", // photo 1603481546238
];

interface TournamentCardProps {
  tournament: TournamentType;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  
  const {
    id,
    title,
    entryFee,
    prizeMoney,
    date,
    time,
    totalSpots,
    filledSpots,
    status,
    isPremium = false,
  } = tournament;
  
  // Use the tournament ID to generate a consistent index for banner image
  const getBannerImage = () => {
    // Use the tournament ID to generate a consistent index
    const idSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = idSum % bannerImages.length;
    return bannerImages[index];
  };
  
  // Get status text and color for display
  const getStatusInfo = () => {
    // Explicitly handle known status values
    switch (status) {
      case "ongoing": 
        return { text: "LIVE NOW", bgColor: "bg-gaming-accent" };
      case "active": 
        return { text: "UPCOMING", bgColor: "bg-blue-500" };
      case "completed": 
        return { text: "COMPLETED", bgColor: "bg-gray-500" };
      case "cancelled": 
        return { text: "CANCELLED", bgColor: "bg-gray-500" };
      default: 
        // For any other status (string or otherwise), return a safe default
        return { 
          text: "UNKNOWN", 
          bgColor: "bg-blue-500" 
        };
    }
  };
  
  const { text: statusText, bgColor: statusBgColor } = getStatusInfo();

  // Format date properly
  const formatDate = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, 'MMM d, yyyy');
    } catch (error) {
      return dateStr; // Return original if parsing fails
    }
  };
  
  const spotsLeft = totalSpots - filledSpots;
  const isFullyBooked = spotsLeft === 0;

  // Handle join tournament action
  const handleJoinTournament = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to tournament details
    
    try {
      setIsJoining(true);
      const result = await joinTournament(id);
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join tournament");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Link to={`/tournament/${id}`} className="block h-full">
      <Card className="overflow-hidden border border-[#333333] transition-all duration-300 ease-in-out rounded-lg bg-[#242839] h-full flex flex-col max-w-full mx-auto hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 hover:scale-[1.02] group">
        {/* Main Content with Banner Image and Overlay Details */}
        <div className="relative w-full aspect-[5/3] overflow-hidden">
          {/* Banner Image */}
          <img 
            src={getBannerImage()} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
          
          {/* Prize and Entry Overlay - Top */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-1.5 transition-opacity duration-300">
            {/* Prize Money */}
            <div className="flex items-center bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded transition-all duration-300 group-hover:bg-black/80">
              <Trophy size={12} className="mr-1 text-gaming-accent" />
              <span className="text-gaming-accent">₹{prizeMoney}</span>
            </div>
            
            {/* Status Badge */}
            <div className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded text-white transition-all duration-300",
              statusBgColor,
              "group-hover:shadow-md group-hover:shadow-purple-500/20 group-hover:scale-105"
            )}>
              {statusText}
            </div>
          </div>
          
          {/* Entry Fee - Bottom right */}
          <div className="absolute bottom-1.5 right-1.5 bg-gaming-accent text-white text-xs font-bold px-1.5 py-0.5 rounded transition-all duration-300 group-hover:bg-gaming-accent/90 group-hover:shadow-md group-hover:shadow-purple-500/20 group-hover:scale-105">
            ₹{entryFee} Entry
          </div>
        </div>
        
        {/* Tournament Title and Details */}
        <div className="p-3 flex-grow">
          <h3 className="font-semibold text-white mb-2 transition-colors duration-300 group-hover:text-purple-400">{title}</h3>
          
          {/* Tournament Info */}
          <div className="space-y-1.5 text-sm text-gray-400">
            <div className="flex items-center transition-transform duration-300 hover:translate-x-1">
              <Calendar size={14} className="mr-1.5 transition-colors duration-300 group-hover:text-purple-400" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center transition-transform duration-300 hover:translate-x-1">
              <Clock size={14} className="mr-1.5 transition-colors duration-300 group-hover:text-purple-400" />
              <span>{time}</span>
            </div>
            <div className="flex items-center transition-transform duration-300 hover:translate-x-1">
              <Users size={14} className="mr-1.5 transition-colors duration-300 group-hover:text-purple-400" />
              <span>{filledSpots}/{totalSpots} Players</span>
            </div>
          </div>
          
          {/* Join button */}
          {status === "active" && !isFullyBooked && (
            <div className="mt-3">
              <Button 
                variant="default" 
                className="w-full bg-gaming-accent hover:bg-gaming-accent/90 text-white transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-md group-hover:shadow-purple-500/20"
                disabled={isJoining}
                onClick={handleJoinTournament}
              >
                {isJoining ? "Joining..." : "Join Tournament"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default TournamentCard;
