import * as React from "react";
import { Home, Trophy, Wallet, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { UserAvatar } from "./ui/UserAvatar";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
  isHighlighted?: boolean;
  index: number;
}

const NavItem = ({ icon, label, to, isActive = false, isHighlighted = false, index }: NavItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
    >
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center text-2xs font-medium transition-colors duration-300",
          isActive ? "text-gaming-primary" : isHighlighted ? "text-white" : "text-gaming-muted hover:text-gaming-text",
          "px-1 py-1.5 w-full" // Increased vertical padding
        )}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex items-center justify-center rounded-full mb-1 transition-all duration-300", 
            isHighlighted 
              ? "bg-gaming-accent shadow-glow-accent w-12 h-12" 
              : isActive 
                ? "bg-gaming-primary/20 shadow-glow w-10 h-10" 
                : "bg-gaming-card hover:bg-gaming-card/80 w-10 h-10"
          )}
        >
          {/* Icon with conditional sizing */}
          {isHighlighted
            ? React.cloneElement(icon as React.ReactElement, { size: 24 })
            : React.cloneElement(icon as React.ReactElement, { size: 22 })}
        </motion.div>
        <motion.span 
          className={cn(
            "truncate transition-all duration-300",
            isHighlighted 
              ? "text-white font-medium text-sm" 
              : "text-sm"
          )}
          animate={{ y: isActive ? -2 : 0 }}
        >
          {label}
        </motion.span>
      </Link>
    </motion.div>
  );
};

interface MobileNavbarProps {
  currentPath: string;
}

const MobileNavbar = ({ currentPath }: MobileNavbarProps) => {
  // Navigation items with their properties
  const navItems = [
    { 
      icon: <Home size={18} />, 
      label: "Home", 
      to: "/home", 
      isActive: currentPath === "/home",
      isHighlighted: false 
    },
    { 
      icon: <Trophy size={18} />, 
      label: "Tournaments", 
      to: "/tournaments", 
      isActive: currentPath === "/tournaments",
      isHighlighted: false
    },
    { 
      icon: <Plus size={18} />, 
      label: "Create", 
      to: "/tournament/create", 
      isActive: currentPath === "/tournament/create",
      isHighlighted: true
    },
    { 
      icon: <Wallet size={18} />, 
      label: "Wallet", 
      to: "/wallet", 
      isActive: currentPath === "/wallet",
      isHighlighted: false
    }
  ];

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gaming-bg/90 border-t border-gaming-border backdrop-blur-lg py-1 pb-safe"
    >
      <nav className="grid grid-cols-5 max-w-md mx-auto">
        {navItems.map((item, index) => (
          <NavItem 
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isActive={item.isActive}
            isHighlighted={item.isHighlighted}
            index={index}
          />
        ))}
        
        {/* User Avatar in the last column */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 4 * 0.1,
              ease: [0.25, 0.1, 0.25, 1.0]
            }}
            className="flex flex-col items-center justify-center"
          >
            <UserAvatar />
            <motion.span className="text-2xs font-medium text-gaming-muted mt-1">
              Profile
            </motion.span>
          </motion.div>
        </div>
      </nav>
    </motion.div>
  );
};

export default MobileNavbar;
