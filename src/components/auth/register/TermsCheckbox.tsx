import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

const TermsCheckbox = ({ checked, onChange, error }: TermsCheckboxProps) => {
  return (
    <div className="flex items-start space-x-2 my-2">
      <Checkbox 
        id="accept-terms" 
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
        className="mt-1 border-gaming-primary/50 data-[state=checked]:bg-gaming-primary"
      />
      <div className="space-y-1">
        <label htmlFor="accept-terms" className="text-xs text-gaming-text/70 cursor-pointer">
          I agree to the{" "}
          <Link 
            to="/terms-and-privacy"
            className="text-gaming-primary hover:underline"
          >
            Terms of Service and Privacy Policy
          </Link>
        </label>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default TermsCheckbox; 