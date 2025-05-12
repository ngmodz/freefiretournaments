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
    <div className="flex justify-end gap-4 pt-4 pb-6">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="border-gaming-border text-gaming-muted hover:bg-gaming-card"
        disabled={loading || userLoading}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="bg-gaming-primary hover:bg-gaming-primary/90 py-6"
        disabled={loading || userLoading}
      >
        {loading || userLoading ? (
          <div className="flex items-center gap-2">
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