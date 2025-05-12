import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { signUpWithEmail, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import NameField from "./NameField";
import EmailField from "./EmailField";
import GameIdField from "./GameIdField";
import PasswordField from "./PasswordField";
import TermsCheckbox from "./TermsCheckbox";
import { validatePassword } from "./utils";

interface RegisterFormProps {
  setActiveTab: (tab: string) => void;
}

const RegisterForm = ({ setActiveTab }: RegisterFormProps) => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    ffid: "",
    password: "",
    acceptedTerms: false
  });
  
  const [formErrors, setFormErrors] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    ffid: "",
    terms: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Update form state
  const updateFormState = (field: keyof typeof formState, value: string | boolean) => {
    setFormState({
      ...formState,
      [field]: value
    });
    
    // Clear any error for this field
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [field]: ""
      });
    }
    
    // Handle password validation
    if (field === "password" && typeof value === "string") {
      setPasswordErrors(validatePassword(value));
    }
  };
  
  const validateRegisterForm = () => {
    const errors = { name: "", email: "", password: "", ffid: "", terms: "" };
    let isValid = true;
    
    if (!formState.name) {
      errors.name = "Name is required";
      isValid = false;
    }
    
    if (!formState.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }
    
    if (!formState.password) {
      errors.password = "Password is required";
      isValid = false;
    } else {
      const passwordValidationErrors = validatePassword(formState.password);
      if (passwordValidationErrors.length > 0) {
        errors.password = "Password does not meet requirements";
        isValid = false;
      }
    }
    
    if (!formState.ffid) {
      errors.ffid = "Free Fire ID is required";
      isValid = false;
    }
    
    if (!formState.acceptedTerms) {
      errors.terms = "You must accept the Terms of Service and Privacy Policy";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Register with Firebase
      const result = await signUpWithEmail(formState.email, formState.password);
      
      if (result.user) {
        try {
          // Ensure the auth state has propagated before writing to Firestore
          // Wait a short moment to ensure Firebase Auth is fully initialized
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create a user profile in the Firestore database with all required fields
          await setDoc(doc(db, 'users', result.user.uid), {
            id: result.user.uid,
            fullName: formState.name,
            email: formState.email,
            uid: formState.ffid, // Free Fire UID
            ign: formState.ffid, // In-game name - can be updated by user later
            phone: "",
            bio: "",
            location: "",
            birthdate: "",
            gender: "",
            avatar_url: null,
            isPremium: false,
            created_at: new Date(),
            updated_at: new Date(),
            displayName: formState.name
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
      <NameField
        value={formState.name}
        onChange={(value) => updateFormState("name", value)}
        error={formErrors.name}
      />
      
      <EmailField
        value={formState.email}
        onChange={(value) => updateFormState("email", value)}
        error={formErrors.email}
      />
      
      <GameIdField
        value={formState.ffid}
        onChange={(value) => updateFormState("ffid", value)}
        error={formErrors.ffid}
      />
      
      <PasswordField
        value={formState.password}
        onChange={(value) => updateFormState("password", value)}
        error={formErrors.password}
        passwordErrors={passwordErrors}
      />
      
      <TermsCheckbox
        checked={formState.acceptedTerms}
        onChange={(checked) => updateFormState("acceptedTerms", checked)}
        error={formErrors.terms}
      />
      
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