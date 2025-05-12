import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordField from "./PasswordField";
import { validatePassword } from "./utils";

interface PasswordFormProps {
  onClose: () => void;
}

const PasswordForm = ({ onClose }: PasswordFormProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    // Validate current password
    if (!form.currentPassword) {
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    // Validate new password using the validation function
    if (!form.newPassword) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else {
      const newPasswordErrors = validatePassword(form.newPassword);
      if (newPasswordErrors.length > 0) {
        errors.newPassword = "Password does not meet requirements";
        isValid = false;
      } else if (form.currentPassword === form.newPassword) {
        errors.newPassword = "New password must be different from current password";
        isValid = false;
      }
    }

    // Validate confirm password
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
      isValid = false;
    } else if (form.newPassword !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({
      ...form,
      [field]: value,
    });

    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - will be replaced with Firebase auth later
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      toast({
        title: "Password updated!",
        description: "Your password has been successfully changed.",
      });

      // Reset form and close dialog
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all fields are filled and valid
  const isFormValid = 
    form.currentPassword.trim() !== "" && 
    form.newPassword.trim() !== "" && 
    form.confirmPassword.trim() !== "" && 
    !formErrors.currentPassword && 
    !formErrors.newPassword && 
    !formErrors.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PasswordField
        id="currentPassword"
        label="Current Password"
        value={form.currentPassword}
        onChange={(value) => handleChange("currentPassword", value)}
        error={formErrors.currentPassword}
        showForgotPassword
        onForgotPassword={() => {
          toast({
            title: "Password Reset Email Sent",
            description: "Check your email for instructions to reset your password",
          });
        }}
      />

      <PasswordField
        id="newPassword"
        label="New Password"
        value={form.newPassword}
        onChange={(value) => handleChange("newPassword", value)}
        error={formErrors.newPassword}
        showSuccess={!formErrors.newPassword && form.newPassword.length > 0}
        successMessage="Password meets requirements"
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm New Password"
        value={form.confirmPassword}
        onChange={(value) => handleChange("confirmPassword", value)}
        error={formErrors.confirmPassword}
        showSuccess={!formErrors.confirmPassword && form.confirmPassword === form.newPassword && form.confirmPassword.length > 0}
        successMessage="Passwords match"
      />

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-transparent border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748] hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Changing Password..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
};

export default PasswordForm; 