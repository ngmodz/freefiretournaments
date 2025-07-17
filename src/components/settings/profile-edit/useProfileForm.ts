import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/contexts/AuthContext";
import { validateUserData, isUIDAvailable, isIGNAvailable, checkUIDExists } from "@/lib/user-utils";
import { FormErrors, ProfileFormData } from "./types";

// Define a type that includes all possible keys with string values
interface ProfileUpdate {
  ign?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
  gender?: string;
  uid?: string;
}

// Define a type that matches the keys in ProfileFormData
type ProfileUpdateKey = keyof ProfileFormData;

export const useProfileForm = (onClose: () => void) => {
  const { toast } = useToast();
  const { user, loading: userLoading, updateProfile, error: userError } = useUserProfile();
  const { currentUser, refreshUserProfile } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    ign: "",
    fullName: "",
    email: "",
    phone: "",
    location: "",
    birthdate: "",
    gender: "",
    uid: "",
  });
  
  const [originalData, setOriginalData] = useState<ProfileFormData>({
    ign: "",
    fullName: "",
    email: "",
    phone: "",
    location: "",
    birthdate: "",
    gender: "",
    uid: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Load initial data from user profile
  useEffect(() => {
    if (user) {
      const initialData = {
        ign: user.ign || "",
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        birthdate: user.birthdate || "",
        gender: user.gender || "",
        uid: user.uid || "",
      };
      
      setFormData(initialData);
      // Keep track of original values to detect changes
      setOriginalData(initialData);
    }
  }, [user]);

  // Show any errors from the useUserProfile hook
  useEffect(() => {
    if (userError) {
      toast({
        title: "Error",
        description: userError,
        variant: "destructive",
      });
    }
  }, [userError, toast]);

  // Check authentication status
  useEffect(() => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to edit your profile",
        variant: "destructive",
      });
    }
  }, [currentUser, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    setValidating(true);
    
    try {
      // Initial validation using utility function - only checks format
      const { valid, errors: validationErrors } = validateUserData(formData);
      const newErrors: Record<string, string> = { ...validationErrors };

      // Asynchronously check if UID is already in use by another user, only if it has changed
      if (formData.uid && formData.uid !== originalData.uid) {
        const uidError = await checkUIDExists(formData.uid);
        if (uidError) {
          newErrors.uid = uidError;
        }
      }
      
      // Aggregate errors from validateUserData and newErrors
      
      // Check required fields if not already caught by validateUserData
      if (!formData.ign && !newErrors.ign) {
        newErrors.ign = "In-game name is required";
      }
      
      if (!formData.uid && !newErrors.uid) {
        newErrors.uid = "UID is required";
      }
      
      if (!formData.email && !newErrors.email) {
        newErrors.email = "Email is required";
      }

      // Add validation for new mandatory fields
      if (!formData.fullName || formData.fullName.trim() === '') {
        newErrors.fullName = "Full Name is required";
      }
      if (!formData.phone || formData.phone.trim() === '') {
        newErrors.phone = "Phone Number is required";
      }
      if (!formData.location || formData.location.trim() === '') {
        newErrors.location = "Location is required";
      }
      if (!formData.gender || formData.gender.trim() === '') {
        newErrors.gender = "Gender is required";
      }
            
      setErrors(newErrors);
      // Return true if newErrors (which includes initial validationErrors) is empty
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "Could not validate form data. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setValidating(false);
    }
  };

  const submitProfileData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Updating Profile",
        description: "Please wait while we update your profile...",
      });
      
      // Prepare updates object - only include changed fields
      const updates: ProfileUpdate = {};
      
      // Compare with original values and only include changed fields
      (Object.keys(formData) as Array<keyof ProfileFormData>).forEach(key => {
        if (formData[key] !== originalData[key]) {
          updates[key] = formData[key] as string;
        }
      });
      
      // Log what fields are actually being updated
      console.log("Fields being updated:", Object.keys(updates));
      console.log("ProfileEditForm - Calling updateProfile with:", updates);
      
      // Only proceed if there are actual changes
      if (Object.keys(updates).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were made to your profile.",
        });
        onClose();
        return;
      }
      
      await updateProfile(updates);
      
      // Refresh the user profile in AuthContext
      if (currentUser) {
        await refreshUserProfile();
      }
      
      onClose();
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("ProfileEditForm - Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      
      // Check for specific errors related to IGN/UID
      if (errorMessage.includes("IGN")) {
        setErrors(prev => ({ ...prev, ign: errorMessage }));
      } else if (errorMessage.includes("UID")) {
        setErrors(prev => ({ ...prev, uid: errorMessage }));
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      await submitProfileData();
    } else {
      toast({
        title: "Validation Failed",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    errors,
    loading,
    userLoading,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
  };
}; 