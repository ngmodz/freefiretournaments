import { Outlet, useLocation } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";
import BlankNavbar from "./BlankNavbar";
import DesktopSidebar from "./DesktopSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Layout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const isTermsPage = currentPath === "/terms-and-privacy";
  const isSettingsPage = currentPath === "/settings";

  // Listen for hover state changes from the sidebar
  const handleSidebarHover = (hovered: boolean) => {
    setIsHovered(hovered);
  };

  // Page transition effect
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => setIsPageTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gaming-bg flex w-full overflow-hidden">
      {!isMobile && (
        <DesktopSidebar 
          currentPath={currentPath} 
          onHoverChange={handleSidebarHover}
        />
      )}
      
      <motion.div 
        className={`flex-1 w-full transition-all duration-300 ease-out ${
          !isMobile ? "lg:ml-16" : ""
        } overflow-hidden`}
        animate={{
          marginLeft: !isMobile ? (isHovered ? "16rem" : "4rem") : "0", // Updated from 14rem to 16rem
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Adjusted bottom padding for terms page and settings page */}
        <div className={`px-0 min-h-screen w-full mx-auto ${
          isMobile 
            ? (isTermsPage 
                ? 'pb-12' 
                : isSettingsPage 
                  ? 'pb-0' 
                  : 'pb-28') 
            : isSettingsPage 
              ? 'pb-0' 
              : 'pb-4'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
              className="w-full overflow-x-hidden"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {isMobile && (isTermsPage ? <BlankNavbar /> : <MobileNavbar currentPath={currentPath} />)}
    </div>
  );
};

export default Layout;
