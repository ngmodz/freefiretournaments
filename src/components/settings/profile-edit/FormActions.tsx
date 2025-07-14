import React from "react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  loading: boolean;
  userLoading: boolean;
  onClose: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({
  loading,
  userLoading,
  onClose
}) => {
  return (
    <div className="flex flex-col gap-3 w-full sm:flex-row sm:gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="w-full rounded-lg border-gaming-border text-gaming-muted hover:bg-gaming-card py-3 text-base font-medium sm:w-1/2"
        disabled={loading || userLoading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        className="w-full rounded-lg bg-gaming-primary hover:bg-gaming-primary/90 py-3 text-base font-bold shadow-lg sm:w-1/2"
        disabled={loading || userLoading}
      >
        {loading || userLoading ? (
          <div className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            <span>Saving...</span>
          </div>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
};

export default FormActions; 