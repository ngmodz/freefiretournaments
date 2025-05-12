import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      // Use Auth context logout
      await logout();
      
      // Redirect to login page
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred while logging out",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button 
      onClick={handleLogout}
      variant="outline"
      className="border-gaming-border text-white hover:bg-[#111827]/50 w-full flex items-center justify-center gap-2"
    >
      <LogOut size={16} />
      <span>Logout</span>
    </Button>
  );
};

export default LogoutButton;
