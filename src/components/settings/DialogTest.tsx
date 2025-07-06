import React from 'react';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/settings/ChangePasswordDialog';
import ForgotPasswordDialog from '@/components/settings/ForgotPasswordDialog';

const DialogTest = () => {
  return (
    <div className="min-h-screen bg-[#1F2937] flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-white text-2xl font-bold mb-8">Dialog Positioning Test</h1>
      
      <div className="space-y-4">
        <ChangePasswordDialog 
          trigger={
            <Button className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
              Test Change Password Dialog
            </Button>
          }
        />
        
        <ForgotPasswordDialog 
          trigger={
            <Button className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white">
              Test Forgot Password Dialog
            </Button>
          }
        />
      </div>
      
      <div className="text-center text-white/70 mt-8 max-w-md">
        <p className="text-sm">
          Test the dialogs above to verify they are properly centered on your device.
          The dialogs should appear in the center of the screen regardless of screen size.
        </p>
      </div>
    </div>
  );
};

export default DialogTest;
