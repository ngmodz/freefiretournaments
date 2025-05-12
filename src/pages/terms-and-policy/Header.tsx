import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NavigateFunction } from "react-router-dom";

interface HeaderProps {
  navigate: NavigateFunction;
}

const Header = ({ navigate }: HeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-gaming-bg/95 backdrop-blur-md border-b border-gaming-border shadow-lg px-4 py-3 flex items-center">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-gaming-text/70 hover:text-gaming-primary"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>
      <h1 className="text-xl font-bold text-gaming-primary mx-auto pr-10">Terms and Policy</h1>
    </div>
  );
};

export default Header; 