import React from "react";
import { ChevronRight } from "lucide-react";

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const SettingsItem = ({ icon, title, description, onClick }: SettingsItemProps) => {
  return (
    <button 
      className="w-full flex items-center gap-4 p-4 text-left hover:bg-gaming-bg/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-102 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gaming-primary/20">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gaming-muted">{description}</p>
      </div>
      <ChevronRight size={18} className="text-gaming-muted" />
    </button>
  );
};

export default SettingsItem;
