import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ProfileEditForm from "@/components/settings/ProfileEditForm";

type ProfileEditSheetContextType = {
  openProfileEdit: () => void;
};

const ProfileEditSheetContext = createContext<ProfileEditSheetContextType | undefined>(undefined);

export const useProfileEditSheet = () => {
  const context = useContext(ProfileEditSheetContext);
  if (!context) {
    throw new Error('useProfileEditSheet must be used within a ProfileEditSheetProvider');
  }
  return context;
};

type ProfileEditSheetProviderProps = {
  children: ReactNode;
};

export const ProfileEditSheetProvider: React.FC<ProfileEditSheetProviderProps> = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const openProfileEdit = () => setIsSheetOpen(true);
  const closeProfileEdit = () => setIsSheetOpen(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProfileEditSheetContext.Provider value={{ openProfileEdit }}>
      {children}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={`bg-gaming-bg border-gaming-border max-h-[95vh] overflow-y-auto rounded-t-xl bottom-sheet-ios-fix ${isMobile ? 'w-full p-4 inset-x-0' : 'p-4'}`}
          style={{
            maxHeight: isMobile ? 'calc(95vh - env(safe-area-inset-bottom))' : '95vh',
            paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
          }}
        >
          <div className="h-full flex flex-col">
            {isMobile && (
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4 flex-shrink-0"></div>
            )}
            <SheetHeader className="mb-6 flex-shrink-0">
              <SheetTitle className="text-xl font-bold text-white">Update Profile</SheetTitle>
              <p className="text-sm text-gaming-muted">Complete your profile to join tournaments</p>
            </SheetHeader>
            
            <div className="flex-1 min-h-0 flex flex-col items-center">
              <ProfileEditForm onClose={closeProfileEdit} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ProfileEditSheetContext.Provider>
  );
}; 