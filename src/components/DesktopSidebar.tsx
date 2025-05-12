import { 
  Home, 
  Trophy, 
  Calendar, 
  Wallet, 
  Settings, 
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "./ui/UserAvatar";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
  isCollapsed: boolean;
  delay?: number;
}

const SidebarItem = ({ icon, label, to, isActive = false, isCollapsed, delay = 0 }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-3 py-3 rounded-md transition-all duration-300 ease-in-out",
        isActive ? "bg-gaming-primary/20 text-gaming-primary" : "text-gaming-muted hover:text-gaming-text hover:bg-gaming-card/80",
        "my-1",
        "hover:-translate-y-1 hover:scale-[1.02]"
      )}
    >
      <motion.div 
        className="flex items-center justify-center w-8 h-8 transition-all duration-300"
      >
        {icon}
      </motion.div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0, x: -10 }}
            animate={{ 
              opacity: 1, 
              width: "auto", 
              x: 0,
              transition: { delay: delay * 0.05, duration: 0.3 } 
            }}
            exit={{ opacity: 0, width: 0, x: -10 }}
            className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

interface DesktopSidebarProps {
  currentPath: string;
  onHoverChange?: (hovered: boolean) => void;
}

const DesktopSidebar = ({ currentPath, onHoverChange }: DesktopSidebarProps) => {
  // Always default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Keep sidebar collapsed by default
    setIsCollapsed(true);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  // Navigation items with icons and labels
  const navItems = [
    { icon: <Home size={20} />, label: "Home", to: "/home" },
    { icon: <Trophy size={20} />, label: "Tournaments", to: "/tournaments" },
    { icon: <Wallet size={20} />, label: "Wallet", to: "/wallet" },
    { icon: <Settings size={20} />, label: "Settings", to: "/settings" }
  ];

  return (
    <motion.div 
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-gaming-card border-r border-gaming-border z-40 shadow-lg"
      animate={{ 
        width: isHovered ? "16rem" : "4rem", // Increased from 14rem to 16rem for more space
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-4 flex items-center">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-8 h-8 bg-gaming-primary rounded-md flex items-center justify-center shadow-glow"
          >
            <Trophy size={18} className="text-white" />
          </motion.div>
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="ml-3 font-bold text-base text-glow whitespace-nowrap overflow-hidden"
              >
                Freefire Tournaments
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2">
          {navItems.map((item, index) => (
            <SidebarItem 
              key={item.to} 
              icon={item.icon} 
              label={item.label} 
              to={item.to} 
              isActive={
                item.to === "/home" 
                  ? currentPath === "/home" 
                  : currentPath.startsWith(item.to)
              } 
              isCollapsed={!isHovered}
              delay={index}
            />
          ))}
        </div>

        {/* User Avatar */}
        {/*
        <div className={cn(
          "p-3 flex items-center justify-center",
          isHovered ? "justify-start" : "justify-center"
        )}>
          <UserAvatar />
        </div>
        */}
        
        {/* Create Tournament Button */}
        <div className="px-3 mb-4 mt-auto">
          <Link
            to="/tournament/create"
            className={cn(
              "flex items-center justify-center px-3 py-2.5 rounded-md transition-all duration-300 ease-in-out bg-gaming-accent text-white shadow-glow-accent",
              !isHovered && "justify-center",
              "hover:-translate-y-1 hover:scale-[1.02]"
            )}
          >
            <motion.div
              className="flex items-center justify-center"
            >
              <Plus size={20} />
            </motion.div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0, x: -10 }}
                  animate={{ opacity: 1, width: "auto", x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="ml-2 text-sm font-medium overflow-hidden whitespace-nowrap"
                >
                  Create Tournament
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default DesktopSidebar;
