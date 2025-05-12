import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase";

interface LoginFormProps {
  setActiveTab: (tab: string) => void;
}

// Password validation helper function
const validatePassword = (password: string) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
};

const LoginForm = ({ setActiveTab }: LoginFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  
  // Password validation errors
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Check password as user types
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setLoginPassword(newPassword);
    
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    } else {
      setPasswordErrors([]);
    }
  };
  
  const validateLoginForm = () => {
    const errors = { email: "", password: "" };
    let isValid = true;
    
    if (!loginEmail) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      errors.email = "Invalid email format";
      isValid = false;
    }
    
    // Password validation
    if (!loginPassword) {
      errors.password = "Password is required";
      isValid = false;
    } else {
      const passwordValidationErrors = validatePassword(loginPassword);
      if (passwordValidationErrors.length > 0) {
        errors.password = "Password does not meet requirements";
        isValid = false;
      }
    }
    
    setLoginErrors(errors);
    return isValid;
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Login with Firebase
      const result = await signInWithEmail(loginEmail, loginPassword);
      
      toast({
        title: "Login successful",
        description: "Welcome to Free Fire Tournament",
      });
      
      // Store in local storage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("userEmail", loginEmail);
      }
      
      // Navigate to home after successful login
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
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
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
          <Mail size={16} className="text-gaming-primary" />
          Email
        </label>
        <Input
          type="email"
          placeholder="your@email.com"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          className={cn(
            "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
            loginErrors.email && "border-red-500"
          )}
        />
        {loginErrors.email && (
          <p className="text-xs text-red-500">{loginErrors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
          <Lock size={16} className="text-gaming-primary" />
          Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={loginPassword}
            onChange={handlePasswordChange}
            className={cn(
              "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text pr-10 focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
              loginErrors.password && "border-red-500"
            )}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gaming-text/50 hover:text-gaming-primary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {loginErrors.password && (
          <p className="text-xs text-red-500">{loginErrors.password}</p>
        )}
        
        {/* Password requirements - only shown when password doesn't meet requirements */}
        {loginPassword && passwordErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gaming-text/70">Password requirements:</p>
            <ul className="text-xs space-y-1">
              <li className={cn("flex items-center gap-1", 
                loginPassword.length >= 8 ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={loginPassword.length >= 8 ? "text-green-500" : "text-gaming-text/50"} />
                Minimum 8 characters
              </li>
              <li className={cn("flex items-center gap-1", 
                /[A-Z]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[A-Z]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One uppercase letter
              </li>
              <li className={cn("flex items-center gap-1", 
                /[a-z]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[a-z]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One lowercase letter
              </li>
              <li className={cn("flex items-center gap-1", 
                /[0-9]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[0-9]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One number
              </li>
              <li className={cn("flex items-center gap-1", 
                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(loginPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One special character
              </li>
            </ul>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="border-gaming-primary/50 data-[state=checked]:bg-gaming-primary"
            />
            <label htmlFor="remember-me" className="text-xs text-gaming-text/70 cursor-pointer">
              Remember me
            </label>
          </div>
          <Link 
            to="/forgot-password" 
            className="text-xs text-gaming-primary hover:text-gaming-primary/90 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gaming-primary hover:bg-gaming-primary/90 text-white font-medium shadow-glow hover:shadow-none transition-all duration-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
