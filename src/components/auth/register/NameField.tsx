import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const NameField = ({ value, onChange, error }: NameFieldProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
        <User size={16} className="text-gaming-primary" />
        Full Name
      </label>
      <Input
        type="text"
        placeholder="Enter your full name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
          error && "border-red-500"
        )}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default NameField; 