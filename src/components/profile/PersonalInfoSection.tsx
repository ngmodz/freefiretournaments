import React, { useState } from "react";
import { User, Edit, CheckCircle, Mail, MapPin, BadgeInfo } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUserProfile } from "@/hooks/use-user-profile";
import { SettingsIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import AvatarDisplay from "@/components/ui/AvatarDisplay";

const PersonalInfoSection = () => {
  const { user, loading, updateProfile, error, isTestMode } = useUserProfile();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [ignValue, setIgnValue] = useState("");

  // Initialize form data when user data is loaded
  React.useEffect(() => {
    if (user) {
      setIgnValue(user.ign);
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Update profile text information
      await updateProfile({ ign: ignValue });
      
      // Reset states
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      // Error is already handled in the hook with toast notifications
    }
  };

  if (loading && !user) {
    return (
      <Card className="bg-[#1F2937] border-gaming-border shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse bg-gray-700 h-6 w-32 rounded mb-4"></div>
            <div className="animate-pulse bg-gray-700 h-6 w-48 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1F2937] border-gaming-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl text-center sm:text-left">
          Profile Information
        </CardTitle>
        <Link 
          to="/settings" 
          className="flex items-center gap-1 text-sm text-gaming-primary hover:text-gaming-primary/80 transition-colors bg-gaming-primary/10 p-2 rounded-md"
        >
          <SettingsIcon size={16} />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Section - using first letter */}
          <div className="flex flex-col items-center gap-2 mb-6 sm:mb-0">
            <AvatarDisplay 
              userProfile={user}
              currentUser={currentUser}
              size="xl" 
            />
            
            <div className="flex flex-wrap justify-center gap-2">
              {isTestMode && (
                <div className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                  Test Mode
                </div>
              )}
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1 space-y-4 w-full text-center sm:text-left">
            <div className="space-y-1">
              <Label className="text-[#A0AEC0] text-sm font-medium">
                Free Fire IGN
              </Label>
              <div className="text-[#FFD700] font-bold text-lg">{user?.ign || "Not set"}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-[#A0AEC0] text-sm font-medium">
                UID
              </Label>
              <div className="text-white font-mono flex items-center justify-center sm:justify-start">
                <BadgeInfo className="w-4 h-4 mr-2 text-gaming-primary/70" />
                <span>{user?.uid || "Not available"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[#A0AEC0] text-sm font-medium">
                Full Name
              </Label>
              <div className="text-white">{user?.fullName || "Not provided"}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-[#A0AEC0] text-sm font-medium">
                Email
              </Label>
              <div className="flex items-center text-white justify-center sm:justify-start">
                <Mail className="w-4 h-4 mr-2 text-gaming-primary/70" />
                <span className="text-ellipsis overflow-hidden">{user?.email || "No email"}</span>
              </div>
            </div>
            
            {user?.location && (
              <div className="space-y-1">
                <Label className="text-[#A0AEC0] text-sm font-medium">
                  Location
                </Label>
                <div className="flex items-center text-white justify-center sm:justify-start">
                  <MapPin className="w-4 h-4 mr-2 text-gaming-primary/70" />
                  {user.location}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bio Section */}
        {user?.bio && (
          <>
            <Separator className="my-4 bg-gaming-border" />
            <div className="space-y-2">
              <Label className="text-[#A0AEC0] text-sm font-medium">
                Bio
              </Label>
              <div className="text-white text-sm">{user.bio}</div>
            </div>
          </>
        )}

        {/* Edit Button */}
        <div className="mt-6 flex justify-center sm:justify-end">
          <Button 
            className="bg-[#1E3A8A] hover:bg-[#2563EB] flex items-center gap-2 w-full sm:w-auto py-6 text-base font-medium shadow-lg"
            onClick={() => window.location.href = "/settings"}
          >
            <Edit size={16} />
            Edit Profile
          </Button>
        </div>

        {error && (
          <div className="mt-4 text-[#EF4444] text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection; 