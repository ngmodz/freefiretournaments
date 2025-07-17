import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileFormData } from "./types";

// URLs for gender-specific avatars
const MALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-gEf9bOMTZtk-unsplash.jpg?updatedAt=1747021921590";
const FEMALE_AVATAR_URL = "https://ik.imagekit.io/d5ydffqlm/luthfi-alfarizi-yXAGGbVuhEY-unsplash.jpg?updatedAt=1747021921747";

interface ProfileAvatarProps {
  formData: ProfileFormData;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ formData }) => {
  // Get avatar URL based on gender
  const getAvatarUrl = () => {
    if (formData.gender) {
      if (formData.gender.toLowerCase() === 'male') {
        return MALE_AVATAR_URL;
      } else if (formData.gender.toLowerCase() === 'female') {
        return FEMALE_AVATAR_URL;
      }
    }
    
    // Return null if no gender is selected or if it's not male/female
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center w-full">
      <div className="relative">
        <Avatar 
          className="w-20 h-20 md:w-24 md:h-24 border-2 border-gaming-primary/50 shadow-lg mx-auto"
        >
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="User avatar" />
          ) : (
            <AvatarFallback className="bg-gaming-primary/20 text-[#FFD700] text-2xl md:text-4xl font-bold">
              {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 
               formData.ign ? formData.ign.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <div className="text-center w-full">
        <h3 className="text-white font-medium text-lg mb-1">Profile Picture</h3>
        <p className="text-gaming-muted text-sm">Select your gender below to set your avatar</p>
      </div>
    </div>
  );
};

export default ProfileAvatar; 