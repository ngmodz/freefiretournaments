import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { signUpWithEmail, auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface RegisterFormProps {
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

const RegisterForm = ({ setActiveTab }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerFFID, setRegisterFFID] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerErrors, setRegisterErrors] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    ffid: "",
    terms: ""
  });
  
  // Password validation errors
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Check password strength as user types
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setRegisterPassword(newPassword);
    
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    } else {
      setPasswordErrors([]);
    }
  };
  
  const validateRegisterForm = () => {
    const errors = { name: "", email: "", password: "", ffid: "", terms: "" };
    let isValid = true;
    
    if (!registerName) {
      errors.name = "Name is required";
      isValid = false;
    }
    
    if (!registerEmail) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(registerEmail)) {
      errors.email = "Invalid email format";
      isValid = false;
    }
    
    // Password validation
    if (!registerPassword) {
      errors.password = "Password is required";
      isValid = false;
    } else {
      const passwordValidationErrors = validatePassword(registerPassword);
      if (passwordValidationErrors.length > 0) {
        errors.password = "Password does not meet requirements";
        isValid = false;
      }
    }
    
    if (!registerFFID) {
      errors.ffid = "Free Fire ID is required";
      isValid = false;
    }
    
    if (!acceptedTerms) {
      errors.terms = "You must accept the Terms of Service and Privacy Policy";
      isValid = false;
    }
    
    setRegisterErrors(errors);
    return isValid;
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Register with Firebase
      const result = await signUpWithEmail(registerEmail, registerPassword);
      
      if (result.user) {
        try {
          // Ensure the auth state has propagated before writing to Firestore
          // Wait a short moment to ensure Firebase Auth is fully initialized
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create a user profile in the Firestore database with all required fields
          await setDoc(doc(db, 'users', result.user.uid), {
            id: result.user.uid,
            fullName: registerName,
            email: registerEmail,
            uid: registerFFID, // Free Fire UID
            ign: registerFFID, // In-game name
            phone: "",
            bio: "",
            location: "",
            birthdate: "",
            gender: "",
            avatar_url: null,
            isPremium: false,
            created_at: new Date(),
            updated_at: new Date(),
            displayName: registerName
          });
          
          console.log("User profile created successfully:", result.user.uid);
          
          toast({
            title: "Registration successful",
            description: "Your account has been created. You can now login.",
          });
          
          // Switch to login tab after successful registration
          setTimeout(() => {
            setActiveTab("login");
          }, 1000);
        } catch (firestoreError: any) {
          console.error("Firestore error:", firestoreError);
          
          // If writing to Firestore fails, delete the authentication user to avoid orphaned accounts
          try {
            await result.user.delete();
          } catch (deleteError) {
            console.error("Error deleting orphaned user:", deleteError);
          }
          
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: "Unable to create user profile. Please try again later.",
          });
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use. Please use a different email or login.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please check your email.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
          <User size={16} className="text-gaming-primary" />
          Full Name
        </label>
        <Input
          type="text"
          placeholder="Enter your full name"
          value={registerName}
          onChange={(e) => setRegisterName(e.target.value)}
          className={cn(
            "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
            registerErrors.name && "border-red-500"
          )}
        />
        {registerErrors.name && (
          <p className="text-xs text-red-500">{registerErrors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
          <Mail size={16} className="text-gaming-primary" />
          Email
        </label>
        <Input
          type="email"
          placeholder="your@email.com"
          value={registerEmail}
          onChange={(e) => setRegisterEmail(e.target.value)}
          className={cn(
            "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
            registerErrors.email && "border-red-500"
          )}
        />
        {registerErrors.email && (
          <p className="text-xs text-red-500">{registerErrors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gaming-text/80 flex items-center gap-2">
          <Trophy size={16} className="text-gaming-accent" />
          FreeFire UID
        </label>
        <Input
          type="text"
          placeholder="Your FreeFire UID"
          value={registerFFID}
          onChange={(e) => setRegisterFFID(e.target.value)}
          className={cn(
            "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
            registerErrors.ffid && "border-red-500"
          )}
        />
        {registerErrors.ffid && (
          <p className="text-xs text-red-500">{registerErrors.ffid}</p>
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
            value={registerPassword}
            onChange={handlePasswordChange}
            className={cn(
              "bg-gaming-bg/60 border-gaming-primary/30 text-gaming-text pr-10 focus:border-gaming-primary focus:ring-gaming-primary autofill:bg-gaming-bg/60 autofill:text-gaming-text [-webkit-autofill]:!text-gaming-text [-webkit-autofill]:!bg-gaming-bg/60",
              registerErrors.password && "border-red-500"
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
        {registerErrors.password && (
          <p className="text-xs text-red-500">{registerErrors.password}</p>
        )}
        
        {/* Password requirements - only shown when password doesn't meet requirements */}
        {registerPassword && passwordErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gaming-text/70">Password requirements:</p>
            <ul className="text-xs space-y-1">
              <li className={cn("flex items-center gap-1", 
                registerPassword.length >= 8 ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={registerPassword.length >= 8 ? "text-green-500" : "text-gaming-text/50"} />
                Minimum 8 characters
              </li>
              <li className={cn("flex items-center gap-1", 
                /[A-Z]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[A-Z]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One uppercase letter
              </li>
              <li className={cn("flex items-center gap-1", 
                /[a-z]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[a-z]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One lowercase letter
              </li>
              <li className={cn("flex items-center gap-1", 
                /[0-9]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[0-9]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One number
              </li>
              <li className={cn("flex items-center gap-1", 
                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50")}>
                <Check size={12} className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(registerPassword) ? "text-green-500" : "text-gaming-text/50"} />
                One special character
              </li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex items-start space-x-2 my-2">
        <Checkbox 
          id="accept-terms" 
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          className="mt-1 border-gaming-primary/50 data-[state=checked]:bg-gaming-primary"
        />
        <div className="space-y-1">
          <label htmlFor="accept-terms" className="text-xs text-gaming-text/70 cursor-pointer">
            I agree to the{" "}
            <Link 
              to="/terms-and-privacy"
              className="text-gaming-primary hover:underline"
            >
              Terms of Service and Privacy Policy
            </Link>
          </label>
          {registerErrors.terms && (
            <p className="text-xs text-red-500">{registerErrors.terms}</p>
          )}
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
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
