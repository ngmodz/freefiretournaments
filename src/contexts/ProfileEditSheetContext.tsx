import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  const openProfileEdit = () => setIsSheetOpen(true);
  const closeProfileEdit = () => setIsSheetOpen(false);

  return (
    <ProfileEditSheetContext.Provider value={{ openProfileEdit }}>
      {children}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
            <ProfileEditForm onClose={closeProfileEdit} />
        </SheetContent>
      </Sheet>
    </ProfileEditSheetContext.Provider>
  );
}; 