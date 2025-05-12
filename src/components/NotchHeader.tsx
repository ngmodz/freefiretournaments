
import React from 'react';

interface NotchHeaderProps {
  backgroundColor?: string;
}

const NotchHeader: React.FC<NotchHeaderProps> = ({ 
  backgroundColor = "#9b87f5" // Changed from blue to purple to match app theme
}) => {
  // Check if the app is running in standalone mode (PWA)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  // Don't render anything if not in PWA mode
  if (!isPWA) return null;

  return (
    <div 
      className="w-full fixed top-0 left-0 z-50"
      style={{
        backgroundColor,
        paddingTop: 'env(safe-area-inset-top)',
        height: 'env(safe-area-inset-top)' // Just enough height for the notch
      }}
      aria-hidden="true"
    >
      {/* Empty header - just for the notch area */}
    </div>
  );
};

export default NotchHeader;
