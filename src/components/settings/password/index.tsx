import React, { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PasswordForm from "./PasswordForm";

interface ChangePasswordDialogProps {
  trigger?: React.ReactNode;
}

const ChangePasswordDialog = ({ trigger }: ChangePasswordDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
            <Lock size={16} />
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1F2937] border-none text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lock size={18} className="text-[#22C55E]" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <PasswordForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog; 