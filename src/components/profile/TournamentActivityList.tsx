import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from '@/lib/utils';

interface TournamentProps {
  id: string;
  title: string;
  date: string;
  time?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  entryFee?: number;
  prizeMoney?: number;
  position?: number;
  participants?: number;
  totalSpots?: number;
  prize?: number;
}

interface TournamentActivityListProps {
  tournaments: TournamentProps[];
  type: 'joined' | 'hosted' | 'winnings';
}

const TournamentActivityList = ({ tournaments, type }: TournamentActivityListProps) => {
  // Animation variants for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#A0AEC0]">
          {type === 'joined' && "You haven't joined any tournaments yet."}
          {type === 'hosted' && "You haven't hosted any tournaments yet."}
          {type === 'winnings' && "You haven't won any tournaments yet."}
        </p>
      </div>
    );
  }

  // Render different layouts based on screen size
  return (
    <>
      {/* Mobile view - Cards */}
      <div className="sm:hidden">
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {tournaments.map((tournament) => (
            <motion.div key={tournament.id} variants={itemVariants}>
              <Card className="bg-[#111827] border-gaming-border hover:border-gaming-primary/50 transition-all duration-300 overflow-hidden">
                <div className="p-4 relative overflow-hidden premium-card-border backdrop-blur-sm">
                  {/* Enhanced gradient effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/5 via-transparent to-gaming-accent/5"></div>
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gaming-primary/10 rounded-full -mr-14 -mt-14 blur-xl"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gaming-accent/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
                  <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gaming-primary/5 rounded-full blur-xl animate-float"></div>
                  <div className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-gaming-accent/5 rounded-full blur-xl animate-float-delayed"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <h3 className="font-bold text-white">{tournament.title}</h3>
                    {tournament.status && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-md font-semibold",
                        tournament.status === 'upcoming' ? "bg-blue-600 text-white" :
                        tournament.status === 'ongoing' ? "bg-gaming-accent text-white" :
                        "bg-gray-600 text-white"
                      )}>
                        {tournament.status === 'upcoming' ? 'UPCOMING' : 
                         tournament.status === 'ongoing' ? 'LIVE' : 'COMPLETED'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-[#A0AEC0] mt-2 relative z-10">
                    <Calendar size={14} className="mr-1.5" />
                    <span>{tournament.date}</span>
                    {tournament.time && (
                      <>
                        <Clock size={14} className="ml-2 mr-1.5" />
                        <span>{tournament.time}</span>
                      </>
                    )}
                  </div>
                  
                  {type === 'joined' && (
                    <div className="mt-3 flex justify-between items-center relative z-10">
                      <div className="text-sm">
                        <span className="text-[#A0AEC0]">Entry: </span>
                        <span className="text-white">{tournament.entryFee} credits</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#A0AEC0]">Prize: </span>
                        <span className="text-white">{tournament.prizeMoney} credits</span>
                      </div>
                      {tournament.position && tournament.prize > 0 && (
                        <div className="flex items-center text-sm">
                          <Trophy size={14} className="mr-1 text-[#FFD700]" />
                          <span className="text-[#FFD700] font-bold">#{tournament.position}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {type === 'hosted' && (
                    <div className="mt-3 flex justify-between items-center relative z-10">
                      <div className="flex items-center text-sm">
                        <Users size={14} className="mr-1.5 text-[#A0AEC0]" />
                        <span className="text-white">{tournament.participants}/{tournament.totalSpots}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#A0AEC0]">Prize: </span>
                        <span className="text-white">{tournament.prizeMoney} credits</span>
                      </div>
                    </div>
                  )}
                  
                  {type === 'winnings' && tournament.prize > 0 && (
                    <div className="mt-3 flex justify-between items-center relative z-10">
                      <div className="flex items-center text-sm">
                        <Trophy size={14} className="mr-1.5 text-[#FFD700]" />
                        <span className="text-[#FFD700] font-semibold">Position #{tournament.position}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#A0AEC0]">Prize: </span>
                        <span className="text-white">{tournament.prize} credits</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 relative z-10">
                    <Link to={`/tournament/${tournament.id}`}>
                      <Button className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Desktop view - Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gaming-border hover:bg-transparent">
              <TableHead className="text-[#A0AEC0]">Tournament</TableHead>
              <TableHead className="text-[#A0AEC0]">Date</TableHead>
              {type === 'joined' && (
                <>
                  <TableHead className="text-[#A0AEC0]">Status</TableHead>
                  <TableHead className="text-[#A0AEC0]">Entry Fee</TableHead>
                  <TableHead className="text-[#A0AEC0]">Prize</TableHead>
                  <TableHead className="text-[#A0AEC0]">Position</TableHead>
                </>
              )}
              {type === 'hosted' && (
                <>
                  <TableHead className="text-[#A0AEC0]">Status</TableHead>
                  <TableHead className="text-[#A0AEC0]">Participants</TableHead>
                  <TableHead className="text-[#A0AEC0]">Prize Pool</TableHead>
                </>
              )}
              {type === 'winnings' && (
                <>
                  <TableHead className="text-[#A0AEC0]">Position</TableHead>
                  <TableHead className="text-[#A0AEC0]">Prize</TableHead>
                </>
              )}
              <TableHead className="text-right text-[#A0AEC0]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((tournament) => (
              <TableRow 
                key={tournament.id} 
                className="border-b border-gaming-border hover:bg-gaming-card/30"
              >
                <TableCell className="font-semibold text-white">{tournament.title}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1.5 text-[#A0AEC0]" />
                    <span className="text-[#A0AEC0]">{tournament.date}</span>
                    {tournament.time && (
                      <>
                        <Clock size={14} className="ml-2 mr-1.5 text-[#A0AEC0]" />
                        <span className="text-[#A0AEC0]">{tournament.time}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                
                {type === 'joined' && (
                  <>
                    <TableCell>
                      {tournament.status && (
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-md font-semibold",
                          tournament.status === 'upcoming' ? "bg-blue-600 text-white" :
                          tournament.status === 'ongoing' ? "bg-gaming-accent text-white" :
                          "bg-gray-600 text-white"
                        )}>
                          {tournament.status === 'upcoming' ? 'UPCOMING' : 
                           tournament.status === 'ongoing' ? 'LIVE' : 'COMPLETED'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{tournament.entryFee} credits</TableCell>
                    <TableCell>{tournament.prizeMoney} credits</TableCell>
                    <TableCell>
                      {tournament.position && tournament.prize > 0 ? (
                        <span className="text-[#FFD700] font-bold">#{tournament.position}</span>
                      ) : (
                        <span className="text-[#A0AEC0]">-</span>
                      )}
                    </TableCell>
                  </>
                )}
                
                {type === 'hosted' && (
                  <>
                    <TableCell>
                      {tournament.status && (
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-md font-semibold",
                          tournament.status === 'upcoming' ? "bg-blue-600 text-white" :
                          tournament.status === 'ongoing' ? "bg-gaming-accent text-white" :
                          "bg-gray-600 text-white"
                        )}>
                          {tournament.status === 'upcoming' ? 'UPCOMING' : 
                           tournament.status === 'ongoing' ? 'LIVE' : 'COMPLETED'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users size={14} className="mr-1.5 text-[#A0AEC0]" />
                        <span>{tournament.participants}/{tournament.totalSpots}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tournament.prizeMoney} credits</TableCell>
                  </>
                )}
                
                {type === 'winnings' && tournament.prize > 0 && (
                  <>
                    <TableCell>
                      <div className="flex items-center">
                        <Trophy size={14} className="mr-1.5 text-[#FFD700]" />
                        <span className="text-[#FFD700] font-semibold">#{tournament.position}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tournament.prize} credits</TableCell>
                  </>
                )}
                
                <TableCell className="text-right">
                  <Link to={`/tournament/${tournament.id}`}>
                    <Button className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-semibold">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default TournamentActivityList;