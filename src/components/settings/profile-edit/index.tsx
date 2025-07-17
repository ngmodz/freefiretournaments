import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ProfileEditFormProps } from "./types";
import { useProfileForm } from "./useProfileForm";
import ProfileAvatar from "./ProfileAvatar";
import BasicInfoSection from "./BasicInfoSection";
import AdditionalInfoSection from "./AdditionalInfoSection";
import FormActions from "./FormActions";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onClose }) => {
  const {
    formData,
    errors,
    loading,
    userLoading,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
  } = useProfileForm(onClose);

  // Show a loading state while user data is being fetched
  if (userLoading && !formData.ign) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">Loading profile data...</p>
      </div>
    );
  }

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