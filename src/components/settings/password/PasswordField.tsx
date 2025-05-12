import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showSuccess?: boolean;
  successMessage?: string;
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
}

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  error,
  showSuccess = false,
  successMessage = "",
  showForgotPassword = false,
  onForgotPassword,
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#A0AEC0]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-[#101010] border-[#2D3748] text-white pr-10 ${
            error ? "border-[#EF4444] focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#1E3A8A]"
          }`}
          placeholder={`Enter your ${label.toLowerCase()}`}
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-[#A0AEC0] hover:text-white"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      
      {error && (
        <p className="text-[#EF4444] text-xs flex items-center gap-1 mt-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      
      {showSuccess && !error && (
        <p className="text-[#22C55E] text-xs flex items-center gap-1 mt-1">
          <Check size={12} />
          {successMessage}
        </p>
      )}
      
      {showForgotPassword && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-[#22C55E] hover:text-[#22C55E]/80 hover:underline transition-colors focus:outline-none"
          >
            Forgot Password?
          </button>
        </div>
      )}
    </div>
  );
};

export default PasswordField; 