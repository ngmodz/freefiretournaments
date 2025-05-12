import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLogo from "@/components/auth/AuthLogo";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import { Toaster } from "@/components/ui/toaster";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const { isLoading } = useAuthCheck({ redirectIfAuthenticated: true, redirectPath: '/home' });
  
  if (isLoading) {
    return (
      <AuthBackground>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
        </div>
      </AuthBackground>
    );
  }
  
  return (
    <AuthBackground>
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <AuthLogo />
        
        {/* Auth Card */}
        <Card className="glass-card bg-gaming-bg border-white/10 p-6 animate-in">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 bg-gaming-bg/50">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gaming-primary data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-gaming-primary data-[state=active]:text-white"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <LoginForm setActiveTab={setActiveTab} />
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register" className="space-y-4">
              <RegisterForm setActiveTab={setActiveTab} />
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* Quick Login */}
        <SocialLoginOptions />
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </AuthBackground>
  );
};

export default Auth;
