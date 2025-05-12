import React from "react";
import { Card } from "@/components/ui/card";
import AvatarDisplay from "@/components/ui/AvatarDisplay";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileSectionProps {
  user: {
    name?: string;
    ign?: string;
    uid?: string;
    email?: string;
  };
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const { currentUser } = useAuth();
  
  return (
    <Card className="p-4 bg-gaming-card border-gaming-border shadow-glow">
      <div className="flex items-center gap-4">
        <AvatarDisplay 
          userProfile={user}
          currentUser={currentUser}
          size="lg" 
        />
        <div className="flex-1">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">{user.name || user.email || "Anonymous User"}</h2>
          </div>
          <p className="text-sm text-gaming-muted text-[#FFD700] font-bold">{user.ign || "Not set"}</p>
          <p className="text-xs text-gaming-muted mt-1">UID: {user.uid || "Not available"}</p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSection; 