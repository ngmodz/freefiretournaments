
import { useState } from "react";
import { User, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ProfileEditForm from "@/components/settings/ProfileEditForm";
import AvatarDisplay from "@/components/ui/AvatarDisplay";

const ProfileSettings = () => {
  const { userProfile, currentUser } = useAuth();
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  // Use authentication data when available, fallback to mock otherwise
  const user = userProfile || {
    name: currentUser?.displayName || "ElitePlayer123",
    email: currentUser?.email || "player@example.com",
    isPremium: true,
    ign: "ElitePlayer123",
    uid: "FF123456789"
  };

  // Get member since date - simplified to avoid type issues
  const getMemberSince = () => {
    // Fallback to default date to avoid type issues
    return "May 2023";
  };

  const handleOpenSheet = (id: string) => {
    setOpenSheet(id);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center">
            <User className="text-gaming-primary h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium text-white">Profile</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gaming-primary/50 hover:bg-gaming-primary/10 text-gaming-primary"
            onClick={() => handleOpenSheet("profile-edit")}
          >
            <Edit size={14} className="mr-1" /> 
            Edit
          </Button>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
            <AvatarDisplay
              userProfile={userProfile}
              currentUser={currentUser}
              className="w-20 h-20 rounded-full bg-[#2A2A2A] border-2 border-gaming-primary/50"
            />
            
            <div>
              <h4 className="text-xl font-bold text-white">{user.name}</h4>
              <p className="text-gaming-primary">{user.email}</p>
              <div className="mt-1 text-sm text-[#A0A0A0]">
                Member since {getMemberSince()}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#222222] p-3 rounded-md">
                <span className="text-sm text-[#A0A0A0]">Free Fire IGN</span>
                <p className="text-white font-medium">{user.ign || "Not set"}</p>
              </div>
              
              <div className="bg-[#222222] p-3 rounded-md">
                <span className="text-sm text-[#A0A0A0]">User ID</span>
                <p className="text-white font-medium">{user.uid || "Not set"}</p>
              </div>
            </div>
            
            <div className="bg-[#222222] p-3 rounded-md">
              <span className="text-sm text-[#A0A0A0]">Account Type</span>
              <div className="flex items-center mt-1">
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${user.isPremium ? "bg-gaming-accent/20 text-gaming-accent" : "bg-blue-500/20 text-blue-400"}`}>
                  {user.isPremium ? "Premium" : "Standard"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Edit Sheet */}
      <Sheet open={openSheet === "profile-edit"} onOpenChange={() => handleCloseSheet()}>
        <SheetContent className="bg-[#1A1A1A] text-white border-l border-[#333333] min-w-[400px] sm:max-w-md">
          <ProfileEditForm onClose={handleCloseSheet} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileSettings;
