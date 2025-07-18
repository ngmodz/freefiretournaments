import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  LogOut
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ContactSupportForm from "@/components/settings/ContactSupportForm";
import FeedbackForm from "@/components/settings/FeedbackForm";
import { useAuth } from "@/contexts/AuthContext";
import AvatarDisplay from "@/components/ui/AvatarDisplay";
import ProfileSection from "./ProfileSection";
import SettingsList from "./SettingsList";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileEditFormWrapper from "@/components/settings/profile-edit";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const { logout, userProfile, currentUser } = useAuth();

  // Use authentication data when available, fallback to mock otherwise
  const user = userProfile || {
    name: currentUser?.displayName || "ElitePlayer123",
    email: currentUser?.email || "player@example.com",
    isHost: true,
    ign: "ElitePlayer123",
    uid: "FF123456789"
  };

  const handleLogout = async () => {
    try {
      await logout();
      
      // Show a success message with shorter duration
      const { dismiss } = toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
      
      // Redirect to login page after toast display time
      setTimeout(() => {
        // Force dismiss the toast
        dismiss();
        navigate("/auth");
      }, 800);
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred while logging out",
        variant: "destructive"
      });
    }
  };

  const handleOpenSheet = (id: string) => {
    setOpenSheet(id);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  const settingsOptions = [
    {
      id: "profile",
      title: "Edit Profile",
      description: "Update your personal information",
      onClick: () => handleOpenSheet("profile"),
    },
    {
      id: "tournaments",
      title: "My Tournaments",
      description: "Tournaments you've joined or hosted",
      onClick: () => navigate("/tournaments"),
    },
    {
      id: "password",
      title: "Change Password",
      description: "Update your password",
      onClick: () => handleOpenSheet("password"),
    },
    {
      id: "feedback",
      title: "Submit Feedback",
      description: "Share your thoughts and suggestions",
      onClick: () => handleOpenSheet("feedback"),
    },
    {
      id: "contact",
      title: "Contact Support",
      description: "Help & support",
      onClick: () => handleOpenSheet("contact"),
    },
  ];

  return (
    <div className="container-padding py-4 h-full max-h-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <Link to="/home" className="flex items-center gap-1 text-sm text-gaming-primary hover:text-gaming-primary/80 transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
        
        {/* Profile Card */}
        <ProfileSection user={user} />
        
        {/* Settings Options List */}
        <Card className="divide-y divide-gaming-border bg-gaming-card border-gaming-border shadow-glow">
          <SettingsList options={settingsOptions} />
          
          <button 
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-gaming-bg/50 transition-all hover:-translate-y-1 hover:shadow-lg duration-200"
            onClick={handleLogout}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-500/20 text-red-500">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-medium text-white">Logout</h3>
              <p className="text-sm text-gaming-muted">Sign out of your account</p>
            </div>
          </button>
        </Card>
      </motion.div>

      {/* Sheet for Profile */}
      <Sheet open={openSheet === "profile"} onOpenChange={handleCloseSheet}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto rounded-t-xl bottom-sheet-ios-fix flex flex-col items-center justify-center p-0"
          style={{
            maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
            paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
            paddingLeft: isMobile ? '0' : '1.5rem',
            paddingRight: isMobile ? '0' : '1.5rem',
            paddingTop: '1rem'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <div className="h-full flex flex-col relative w-full max-w-md mx-auto px-6">
            {isMobile && (
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            )}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <p className="text-sm text-gaming-muted">Update your personal information</p>
            </div>
            
            <div className="flex-1 overflow-auto pb-10">
              <ProfileEditFormWrapper onClose={handleCloseSheet} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for Password */}
      <Sheet open={openSheet === "password"} onOpenChange={handleCloseSheet}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
          style={{
            maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
            paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <div className="h-full flex flex-col relative">
            {isMobile && (
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            )}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <p className="text-sm text-gaming-muted">Update your account password</p>
            </div>
            
            <div className="flex-1 overflow-auto">
              <ChangePasswordForm onClose={handleCloseSheet} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for Feedback */}
      <Sheet open={openSheet === "feedback"} onOpenChange={handleCloseSheet}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
          style={{
            maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
            paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <div className="h-full flex flex-col relative">
            {isMobile && (
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            )}
            <div className={`mb-6 ${isMobile ? 'px-4' : ''}`}>
              <h2 className="text-xl font-bold text-white">Submit Feedback</h2>
              <p className="text-sm text-gaming-muted">Share your thoughts, suggestions, or report issues</p>
            </div>
            
            <div className={`flex-1 overflow-auto ${isMobile ? 'pb-4 px-4' : ''}`}>
              <FeedbackForm onClose={handleCloseSheet} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for Contact Support */}
      <Sheet open={openSheet === "contact"} onOpenChange={handleCloseSheet}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
          style={{
            maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
            paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <div className="h-full flex flex-col relative">
            {isMobile && (
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            )}
            <div className={`mb-6 ${isMobile ? 'px-4' : ''}`}>
              <h2 className="text-xl font-bold text-white">Contact Support</h2>
              <p className="text-sm text-gaming-muted">Questions, feedback, or bug reports</p>
            </div>
            
            <div className={`flex-1 overflow-auto ${isMobile ? 'pb-4 px-4' : ''}`}>
              <ContactSupportForm onClose={handleCloseSheet} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Settings; 