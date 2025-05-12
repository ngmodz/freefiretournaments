import { useState } from "react";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  passwordErrors: string[];
}

const PasswordField = ({ value, onChange, error, passwordErrors }: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
        <Lock size={16} className="text-gaming-primary" />
        Password
      </label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text pr-10 focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
            error && "border-red-500"
          )}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gaming-text/50 hover:text-gaming-primary"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      
      {/* Password requirements - only shown when password doesn't meet requirements */}
      {value && passwordErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gaming-text/70">Password requirements:</p>
          <ul className="text-xs space-y-1">
            <li className={cn("flex items-center gap-1", 
              value.length >= 8 ? "text-green-500" : "text-gaming-text/50")}>
              <Check size={12} className={value.length >= 8 ? "text-green-500" : "text-gaming-text/50"} />
              Minimum 8 characters
            </li>
            <li className={cn("flex items-center gap-1", 
              /[A-Z]/.test(value) ? "text-green-500" : "text-gaming-text/50")}>
              <Check size={12} className={/[A-Z]/.test(value) ? "text-green-500" : "text-gaming-text/50"} />
              One uppercase letter
            </li>
            <li className={cn("flex items-center gap-1", 
              /[a-z]/.test(value) ? "text-green-500" : "text-gaming-text/50")}>
              <Check size={12} className={/[a-z]/.test(value) ? "text-green-500" : "text-gaming-text/50"} />
              One lowercase letter
            </li>
            <li className={cn("flex items-center gap-1", 
              /[0-9]/.test(value) ? "text-green-500" : "text-gaming-text/50")}>
              <Check size={12} className={/[0-9]/.test(value) ? "text-green-500" : "text-gaming-text/50"} />
              One number
            </li>
            <li className={cn("flex items-center gap-1", 
              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ? "text-green-500" : "text-gaming-text/50")}>
              <Check size={12} className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ? "text-green-500" : "text-gaming-text/50"} />
              One special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordField; 