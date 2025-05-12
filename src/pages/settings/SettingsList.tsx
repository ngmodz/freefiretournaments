import React from "react";
import SettingsItem from "@/components/settings/SettingsItem";
import { Edit, Trophy, Lock, MessageSquare } from "lucide-react";

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  onClick: () => void;
}

interface SettingsListProps {
  options: SettingsOption[];
}

const SettingsList = ({ options }: SettingsListProps) => {
  // Map icons to settings based on ID
  const getIconForSetting = (id: string) => {
    switch (id) {
      case "profile":
        return <Edit size={20} className="text-gaming-primary" />;
      case "tournaments":
        return <Trophy size={20} className="text-gaming-accent" />;
      case "password":
        return <Lock size={20} className="text-[#ec4899]" />;
      case "contact":
        return <MessageSquare size={20} className="text-[#8b5cf6]" />;
      default:
        return null;
    }
  };

  return (
    <>
      {options.map((option) => (
        <SettingsItem
          key={option.id}
          icon={getIconForSetting(option.id)}
          title={option.title}
          description={option.description}
          onClick={option.onClick}
        />
      ))}
    </>
  );
};

export default SettingsList; 