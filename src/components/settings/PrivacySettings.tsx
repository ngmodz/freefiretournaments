
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PrivacySettings = () => {
  const { toast } = useToast();
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    publicProfile: true,
    showStats: true
  });
  
  const handlePrivacyToggle = (setting: string) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting as keyof typeof privacySettings]
    });
    
    // Success notification
    toast({
      title: "Settings updated",
      description: "Your privacy settings have been saved"
    });
  };
  
  return (
    <Card className="bg-[#1F2937] border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={20} className="text-gaming-primary" />
          Privacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Show Online Status</h3>
              <p className="text-xs text-[#A0AEC0]">Allow others to see when you're online</p>
            </div>
            <Switch 
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={() => handlePrivacyToggle('showOnlineStatus')}
              className="data-[state=checked]:bg-gaming-primary"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Public Profile</h3>
              <p className="text-xs text-[#A0AEC0]">Make your profile visible to everyone</p>
            </div>
            <Switch 
              checked={privacySettings.publicProfile}
              onCheckedChange={() => handlePrivacyToggle('publicProfile')}
              className="data-[state=checked]:bg-gaming-primary"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Show Game Statistics</h3>
              <p className="text-xs text-[#A0AEC0]">Display your game stats on your profile</p>
            </div>
            <Switch 
              checked={privacySettings.showStats}
              onCheckedChange={() => handlePrivacyToggle('showStats')}
              className="data-[state=checked]:bg-gaming-primary"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
