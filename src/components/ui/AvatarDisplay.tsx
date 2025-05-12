import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarLetter } from "@/components/ui/UserAvatar";

// URLs for gender-specific avatars
const MALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-gEf9bOMTZtk-unsplash.jpg?updatedAt=1747021921590";
const FEMALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-yXAGGbVuhEY-unsplash.jpg?updatedAt=1747021921747";

// Extended user profile type to include gender
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

interface AvatarDisplayProps {
  userProfile: any;
  currentUser: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * A consistent avatar display component that uses gender-specific avatars or the first letter of the user's name
 */
export function AvatarDisplay({ 
  userProfile, 
  currentUser, 
  size = 'md',
  className = ''
}: AvatarDisplayProps) {
  // Determine size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  // Determine font size
  const fontSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  // Determine avatar URL based on gender
  const getAvatarUrl = () => {
    if (userProfile) {
      const profile = userProfile as ExtendedUserProfile;
      if (profile.gender) {
        if (profile.gender.toLowerCase() === 'male') {
          return MALE_AVATAR_URL;
        } else if (profile.gender.toLowerCase() === 'female') {
          return FEMALE_AVATAR_URL;
        }
      }
      
      // Use custom avatar if available, otherwise null
      return profile.avatar_url || null;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <Avatar className={`${sizeClasses[size]} border-2 border-gaming-primary shadow-glow ${className}`}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="User avatar" />
      ) : (
        <AvatarFallback className={`bg-gaming-primary/20 text-[#FFD700] ${fontSizeClasses[size]} font-bold`}>
          {getAvatarLetter(userProfile, currentUser)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default AvatarDisplay;
