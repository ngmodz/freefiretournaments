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
      {/* Password requirements UI removed */}
    </div>
  );
};

export default PasswordField; 