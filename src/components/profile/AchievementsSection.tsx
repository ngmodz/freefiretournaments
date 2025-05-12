import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Award, Trophy, Target, Star, User, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// Mock achievement data - would come from Firebase in the future
const mockAchievements = [
  {
    id: "a1",
    name: "First Blood",
    description: "Participate in your first tournament",
    icon: <Trophy size={24} />,
    unlocked: true,
    date: "2023-05-01"
  },
  {
    id: "a2",
    name: "Winner Winner",
    description: "Win your first tournament",
    icon: <Award size={24} />,
    unlocked: true,
    date: "2023-05-10"
  },
  {
    id: "a3",
    name: "Tournament Host",
    description: "Successfully host a tournament",
    icon: <User size={24} />,
    unlocked: true,
    date: "2023-05-15"
  },
  {
    id: "a4",
    name: "Sharpshooter",
    description: "Achieve highest kills in a tournament",
    icon: <Target size={24} />,
    unlocked: false,
    progress: 70
  },
  {
    id: "a5",
    name: "Pro Player",
    description: "Participate in 10 tournaments",
    icon: <Star size={24} />,
    unlocked: false,
    progress: 30
  },
  {
    id: "a6",
    name: "On Fire",
    description: "Win 3 tournaments in a row",
    icon: <Flame size={24} />,
    unlocked: false,
    progress: 10
  }
];

const AchievementItem = ({ achievement }: { achievement: any }) => {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <motion.div 
          className={`bg-[#111827] rounded-lg p-3 flex flex-col items-center justify-center aspect-square relative
            ${achievement.unlocked ? "border border-[#FFD700]" : "border border-gaming-border"}
          `}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`rounded-full p-2.5 mb-2 
            ${achievement.unlocked ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-gaming-card/40 text-[#A0AEC0]"}
          `}>
            {achievement.icon}
          </div>
          <h3 className={`text-xs font-medium text-center ${achievement.unlocked ? "text-white" : "text-[#A0AEC0]"}`}>
            {achievement.name}
          </h3>
          
          {/* Progress indicator for locked achievements */}
          {!achievement.unlocked && achievement.progress !== undefined && (
            <div className="w-full bg-[#1F2937] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gaming-primary h-full rounded-full" 
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          )}
          
          {/* Badge for unlocked achievements */}
          {achievement.unlocked && (
            <div className="absolute -top-1.5 -right-1.5 bg-[#FFD700] text-black text-xs rounded-full p-1 h-6 w-6 flex items-center justify-center shadow-lg">
              ✓
            </div>
          )}
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent className="bg-[#111827] border-gaming-border text-white p-3 max-w-[200px]">
        <h4 className="font-medium">{achievement.name}</h4>
        <p className="text-xs text-[#A0AEC0] mt-1">{achievement.description}</p>
        {achievement.unlocked ? (
          <p className="text-xs text-[#FFD700] mt-2">Unlocked on {achievement.date}</p>
        ) : (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A0AEC0]">Progress</span>
              <span className="text-[#A0AEC0]">{achievement.progress}%</span>
            </div>
            <div className="w-full bg-[#1F2937] h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-gaming-primary h-full rounded-full" 
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

const AchievementsSection = () => {
  const unlockedAchievements = mockAchievements.filter(a => a.unlocked).length;
  const totalAchievements = mockAchievements.length;
  
  return (
    <Card className="bg-[#1F2937] border-gaming-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Award size={20} className="text-[#FFD700]" />
          Achievements
        </CardTitle>
        <span className="text-sm text-[#A0AEC0]">
          {unlockedAchievements}/{totalAchievements} Unlocked
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {mockAchievements.map((achievement) => (
            <AchievementItem key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsSection;
