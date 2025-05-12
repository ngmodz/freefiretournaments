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
    <div className="flex flex-col sm:flex-row gap-8 items-center pb-4">
      <div className="relative">
        <Avatar 
          className="w-24 h-24 border-2 border-[#A0AEC0] shadow-md"
        >
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="User avatar" />
          ) : (
            <AvatarFallback className="bg-gaming-primary/20 text-[#FFD700] text-4xl font-bold">
              {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 
               formData.ign ? formData.ign.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <div className="text-sm text-gray-400 text-center sm:text-left">
        <h3 className="text-white font-medium text-lg mb-1">Profile Picture</h3>
        <p>Select your gender in the form below to set your avatar.</p>
      </div>
    </div>
  );
};

export default ProfileAvatar; 