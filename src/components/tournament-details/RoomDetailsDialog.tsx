import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RoomDetailsDialogProps } from "./types";

// Custom DialogContent without close button
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const RoomDetailsDialog: React.FC<RoomDetailsDialogProps> = ({
  isOpen,
  setIsOpen,
  roomId,
  setRoomId,
  roomPassword,
  setRoomPassword,
  onSave,
  isSaving
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto max-w-[90%] sm:max-w-md mx-auto p-0 border-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-gradient-to-b from-[#1F2937] to-[#111827] text-white rounded-lg shadow-lg border border-gaming-border/20 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          
          <div className="relative p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl font-bold">Set Custom Room Details</DialogTitle>
              <DialogDescription className="text-gaming-muted text-sm sm:text-base">
                Enter the Room ID and Password for this tournament. This will be visible to joined participants.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <Label htmlFor="roomId" className="text-gaming-muted">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-[#111827] border-gaming-border focus:ring-gaming-primary text-white placeholder:text-gray-500 h-9 sm:h-10 text-sm sm:text-base"
                  placeholder="Enter Room ID"
                  style={{ color: 'white' }}
                />
              </motion.div>
              
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <Label htmlFor="roomPassword" className="text-gaming-muted">
                  Password
                </Label>
                <Input
                  id="roomPassword"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full bg-[#111827] border-gaming-border focus:ring-gaming-primary text-white placeholder:text-gray-500 h-9 sm:h-10 text-sm sm:text-base"
                  placeholder="Enter Room Password"
                  style={{ color: 'white' }}
                />
              </motion.div>
            </div>
            
            <DialogFooter className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <motion.div 
                whileHover={{ scale: isSaving ? 1 : 1.03 }}
                whileTap={{ scale: isSaving ? 1 : 0.97 }}
                className="w-full sm:w-auto order-1 sm:order-1"
              >
                <Button 
                  type="button" 
                  onClick={onSave}
                  disabled={isSaving}
                  className="transition-all duration-300 w-full text-sm sm:text-base h-9 sm:h-10 bg-[#22C55E] text-white hover:opacity-90 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  {isSaving ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : null}
                  Save Details
                </Button>
              </motion.div>
              
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="bg-transparent border-gaming-border/50 text-white hover:bg-gaming-bg/80 hover:text-white/80 transition-all duration-200 w-full sm:w-auto order-2 sm:order-2 text-sm sm:text-base h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailsDialog; 