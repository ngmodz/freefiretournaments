import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsIcon } from "lucide-react";
import ChangePasswordDialog from "./ChangePasswordDialog";

const AccountSettings = () => {
  return (
    <Card className="bg-[#1F2937] border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon size={20} className="text-gaming-primary" />
          Account Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#A0AEC0] mb-4">
              Securely manage your account password. We recommend using a strong, unique password 
              that you don't use for other services.
            </p>
            <ChangePasswordDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;
