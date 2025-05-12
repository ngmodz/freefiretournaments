import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/firebase";

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.6402 9.18219C17.6402 8.56397 17.582 7.96409 17.4729 7.38219H9V10.8113H13.8447C13.6366 11.9701 13.0084 12.9533 12.0483 13.5842V15.7056H14.6366C16.4941 14.0467 17.6402 11.8105 17.6402 9.18219Z" fill="#4285F4"/>
    <path d="M9.00001 18C11.432 18 13.4678 17.1928 14.6366 15.7055L12.0483 13.5841C11.233 14.1227 10.2135 14.4545 9.00001 14.4545C6.65569 14.4545 4.67183 12.8373 3.96409 10.69H1.2959V12.88C2.45296 15.0949 5.47909 18 9.00001 18Z" fill="#34A853"/>
    <path d="M3.96403 10.6901C3.78403 10.1515 3.68175 9.58193 3.68175 9.00006C3.68175 8.41819 3.78403 7.84854 3.96403 7.30997V5.12006H1.29584C0.477205 6.7137 0 8.41819 0 9.00006C0 9.58193 0.477205 11.2864 1.29584 12.88L3.96403 10.6901Z" fill="#FBBC05"/>
    <path d="M9.00001 3.54545C10.3214 3.54545 11.5079 4.00909 12.4768 4.92545L14.6923 2.78727C13.4602 1.07273 11.4243 0 9.00001 0C5.47909 0 2.45296 2.90509 1.2959 5.12L3.96415 7.30999C4.67189 5.16272 6.65575 3.54545 9.00001 3.54545Z" fill="#EA4335"/>
  </svg>
);

const SocialLoginOptions = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await signInWithGoogle();
      
      toast({
        title: "Google login successful",
        description: "Welcome to Free Fire Tournament",
      });
      
      // Navigate to home after successful login
      navigate('/home');
    } catch (error: any) {
      console.error("Google login error:", error);
      
      let errorMessage = "Failed to login with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login canceled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Login popup was blocked. Please allow popups for this website.";
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gaming-primary/20"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-gaming-bg text-gaming-text/50">Or continue with</span>
        </div>
      </div>
      
      <div className="flex space-x-3 justify-center">
        <Button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          variant="outline"
          className="bg-gaming-bg/60 hover:bg-gaming-primary/20 text-gaming-text border border-gaming-primary/30 flex-1 flex items-center justify-center gap-2"
        >
          <GoogleLogo />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default SocialLoginOptions;
