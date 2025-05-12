
import React, { useEffect, useState } from 'react';
import NotchHeader from './NotchHeader';

interface PWALayoutWrapperProps {
  children: React.ReactNode;
}

const PWALayoutWrapper: React.FC<PWALayoutWrapperProps> = ({ children }) => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
    setIsPWA(isPWAMode);
  }, []);

  return (
    <div className="min-h-screen bg-gaming-bg flex flex-col w-full">
      <NotchHeader />
      <div className={`flex-1 w-full ${isPWA ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default PWALayoutWrapper;
