import * as React from "react";
import { Home, Trophy, Wallet, User, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { UserAvatar } from "./ui/UserAvatar";
import CreditDisplay from "./ui/CreditDisplay";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
  isHighlighted?: boolean;
  index: number;
}

const NavItem = ({ icon, label, to, onClick, isActive = false, isHighlighted = false, index }: NavItemProps) => {
  const content = (
    <>
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
    </>
  );

  const commonClassNames = cn(
    "flex flex-col items-center justify-center text-2xs font-medium transition-colors duration-300",
    isActive ? "text-gaming-primary" : isHighlighted ? "text-white" : "text-gaming-muted hover:text-gaming-text",
    "px-1 py-1.5 w-full"
  );

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
      {onClick ? (
        <div onClick={onClick} className={`${commonClassNames} cursor-pointer`}>
          {content}
        </div>
      ) : (
        <Link
          to={to!}
          className={commonClassNames}
        >
          {content}
        </Link>
      )}
    </motion.div>
  );
};

interface MobileNavbarProps {
  currentPath: string;
}

const MobileNavbar = ({ currentPath }: MobileNavbarProps) => {
  const { user } = useUserProfile();
  const navigate = useNavigate();
  const [showHostApplyDialog, setShowHostApplyDialog] = React.useState(false);

  const handleCreateTournamentClick = () => {
    if (user?.isHost) {
      navigate('/tournament/create');
    } else {
      setShowHostApplyDialog(true);
    }
  };

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
      onClick: handleCreateTournamentClick,
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
    <>
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gaming-bg/90 border-t border-gaming-border backdrop-blur-lg py-1 pb-safe"
      >

        <nav className="grid grid-cols-5 max-w-md mx-auto">
          {navItems.map((item, index) => (
            <NavItem 
              key={item.label}
              icon={item.icon}
              label={item.label}
              to={item.to}
              onClick={item.onClick}
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
      <AlertDialog open={showHostApplyDialog} onOpenChange={setShowHostApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Want to host your own tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              To create a tournament, you need to be a host. Apply to become a host and start creating your own tournaments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              navigate('/apply-host');
              setShowHostApplyDialog(false);
            }}>
              Apply as Host
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileNavbar;
