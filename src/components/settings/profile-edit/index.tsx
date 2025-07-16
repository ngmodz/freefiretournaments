import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ProfileEditFormProps } from "./types";
import { useProfileForm } from "./useProfileForm";
import ProfileAvatar from "./ProfileAvatar";
import BasicInfoSection from "./BasicInfoSection";
import AdditionalInfoSection from "./AdditionalInfoSection";
import FormActions from "./FormActions";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onClose }) => {
  const [bypassValidation, setBypassValidation] = useState(false);
  
  const {
    formData,
    errors,
    loading,
    userLoading,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    directSubmit
  } = useProfileForm(onClose, bypassValidation);

  // Show a loading state while user data is being fetched
  if (userLoading && !formData.ign) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">Loading profile data...</p>
      </div>
    );
  }

  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBypassValidation(true);
    // Small delay to ensure state is updated
    setTimeout(() => {
      directSubmit();
    }, 100);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="profile-edit-form space-y-6"
    >
      {/* Profile Avatar - Mobile optimized */}
      <div className="px-1">
        <ProfileAvatar formData={formData} />
      </div>
      
      <Separator className="bg-gaming-border opacity-50" />
      
      {/* Basic Information Section - Mobile optimized */}
      <div className="px-1">
        <BasicInfoSection 
          formData={formData}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      </div>
      
      <Separator className="bg-gaming-border opacity-50" />
      
      {/* Additional Information Section - Mobile optimized */}
      <div className="px-1">
        <AdditionalInfoSection 
          formData={formData}
          errors={errors}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
        />
      </div>
      
      {/* Debug Button */}
      {(errors.ign || errors.uid) && (
        <div className="mt-4 pt-4 border-t border-gaming-border px-1">
          <Button
            type="button"
            onClick={handleDebugSubmit}
            variant="outline"
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/30 flex items-center justify-center gap-2"
          >
            <Bug size={16} />
            Force Update Profile (Bypass Validation)
          </Button>
          <p className="text-yellow-500 text-xs mt-2 text-center">
            Warning: This is a debug option to bypass the validation errors. Use only if you're sure the IGN/UID are truly yours and the system is showing incorrect validation errors.
          </p>
        </div>
      )}
      
      {/* Form Actions at the bottom */}
      <div className="border-t border-gaming-border pt-4 px-1 mt-8">
        <FormActions 
          loading={loading}
          userLoading={userLoading}
          onClose={onClose}
        />
      </div>
    </form>
  );
};

export default ProfileEditForm; 