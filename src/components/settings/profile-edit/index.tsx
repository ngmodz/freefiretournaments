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
        <div className="animate-pulse bg-gray-700 h-6 w-32 rounded mb-4"></div>
        <div className="animate-pulse bg-gray-700 h-6 w-48 rounded"></div>
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
      className="profile-edit-form space-y-8"
    >
      {/* Profile Avatar */}
      <ProfileAvatar formData={formData} />
      
      <Separator className="bg-gray-800" />
      
      {/* Basic Information Section */}
      <BasicInfoSection 
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
      />
      
      <Separator className="my-6 bg-gaming-border" />
      
      {/* Additional Information Section */}
      <AdditionalInfoSection 
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
      />
      
      {/* Form Actions */}
      <FormActions 
        loading={loading}
        userLoading={userLoading}
        onClose={onClose}
      />
      
      {/* Debug Button */}
      {(errors.ign || errors.uid) && (
        <div className="mt-4 pt-4 border-t border-gray-800">
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
    </form>
  );
};

export default ProfileEditForm; 