import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Extend the UserProfile type to include gender
interface ExtendedUserProfile {
  id: string;
  name?: string;
  ign?: string;
  uid?: string;
  email: string;
  avatar_url: string | null;
  isPremium: boolean;
  gender?: string;
  fullName?: string;
}

// Helper function to get the avatar letter - can be reused elsewhere too
export function getAvatarLetter(userProfile: any, currentUser: any): string {
  // Try different properties in order of preference
  if (userProfile?.ign && userProfile.ign.length > 0) {
    return userProfile.ign.charAt(0).toUpperCase();
  }
  if (userProfile?.name && userProfile.name.length > 0) {
    return userProfile.name.charAt(0).toUpperCase();
  }
  if (userProfile?.fullName && userProfile.fullName.length > 0) {
    return userProfile.fullName.charAt(0).toUpperCase();
  }
  if (currentUser?.displayName && currentUser.displayName.length > 0) {
    return currentUser.displayName.charAt(0).toUpperCase();
  }
  if (currentUser?.email && currentUser.email.length > 0) {
    return currentUser.email.charAt(0).toUpperCase();
  }
  return "U"; // Default fallback
}

// URLs for gender-specific avatars
const MALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-gEf9bOMTZtk-unsplash.jpg?updatedAt=1747021921590";
const FEMALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-yXAGGbVuhEY-unsplash.jpg?updatedAt=1747021921747";

export function UserAvatar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [initials, setInitials] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setInitials(getAvatarLetter(userProfile, currentUser));
    
    // Set avatar URL based on gender if available
    if (userProfile) {
      const profile = userProfile as ExtendedUserProfile;
      if (profile.gender) {
        if (profile.gender.toLowerCase() === 'male') {
          setAvatarUrl(MALE_AVATAR_URL);
        } else if (profile.gender.toLowerCase() === 'female') {
          setAvatarUrl(FEMALE_AVATAR_URL);
        } else {
          // Use custom avatar if available, otherwise null
          setAvatarUrl(profile.avatar_url || null);
        }
      } else {
        // Use custom avatar if available, otherwise null
        setAvatarUrl(profile.avatar_url || null);
      }
    }
  }, [currentUser, userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      navigate('/home');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  if (!currentUser) {
    return (
      <Button onClick={() => navigate('/auth')} variant="outline" className="border-gaming-primary/30">
        Login
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer border border-gaming-primary/30">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="User avatar" />
          ) : (
            <AvatarFallback className="bg-gaming-primary/20 text-[#FFD700] font-bold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gaming-card border-gaming-primary/30 text-gaming-text">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{userProfile?.name || currentUser.email}</p>
            {userProfile?.ign && (
              <p className="text-xs text-gaming-text/70">IGN: {userProfile.ign}</p>
            )}
            <p className="text-xs text-gaming-text/70">{currentUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gaming-primary/20" />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gaming-primary/20" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 