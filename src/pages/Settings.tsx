import React, { useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  ArrowLeft, 
  Settings as SettingsIcon,
  Edit,
  Trophy,
  Lock,
  MessageSquare,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Trash2,
  Mail,
  Github,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import SettingsItem from "@/components/settings/SettingsItem";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ContactSupportForm from "@/components/settings/ContactSupportForm";
import ProfileEditForm from "@/components/settings/ProfileEditForm";
import ChangePasswordDialog from "@/components/settings/ChangePasswordDialog";
import ForgotPasswordDialog from "@/components/settings/ForgotPasswordDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import AvatarDisplay from "@/components/ui/AvatarDisplay";
import { auth, db } from "@/lib/firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  GoogleAuthProvider,
  signInWithPopup, 
  getAuth
} from "firebase/auth";

// Context for opening the profile edit sheet globally
type ProfileEditSheetContextType = { openProfileEdit: () => void };
const ProfileEditSheetContext = createContext<ProfileEditSheetContextType | undefined>(undefined);
export const useProfileEditSheet = () => {
  const ctx = useContext(ProfileEditSheetContext);
  if (!ctx) throw new Error("useProfileEditSheet must be used within ProfileEditSheetProvider");
  return ctx;
};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const { logout, userProfile, currentUser, googleSignIn } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [reAuthError, setReAuthError] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Use authentication data when available, fallback to mock otherwise
  const user = userProfile || {
    name: currentUser?.displayName || "ElitePlayer123",
    email: currentUser?.email || "player@example.com",
    isHost: true,
    ign: "ElitePlayer123",
    uid: "FF123456789"
  };

  // Get member since date - simplified to avoid type issues
  const getMemberSince = () => {
    // Fallback to default date to avoid type issues
    return "May 2023";
  };

  const handleLogout = async () => {
    try {
      await logout();
      
      // Show a success message with shorter duration
      const { dismiss } = toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
      
      // Redirect to login page after toast display time
      setTimeout(() => {
        // Force dismiss the toast
        dismiss();
        navigate("/auth");
      }, 800);
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred while logging out",
        variant: "destructive"
      });
    }
  };

  const handleOpenSheet = (id: string) => {
    setOpenSheet(id);
  };
  const openProfileEdit = () => setOpenSheet("profile");

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  const handleGoogleReauth = async () => {
    try {
      setIsReauthenticating(true);
      await googleSignIn();
      await handleDeleteAccountAfterReauth();
    } catch (error) {
      console.error("Google reauth error:", error);
      setReAuthError("Failed to authenticate with Google. Please try again.");
      setIsReauthenticating(false);
    }
  };

  const handleDeleteAccountAfterReauth = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("No user is currently signed in");
      }
      
      // Add detailed logging
      console.log("Starting account deletion process for user:", user.uid);
      
      try {
        // Delete user's tournaments data
        console.log("Deleting user tournaments...");
        const tournamentsQuery = query(
          collection(db, 'tournaments'),
          where('createdBy', '==', user.uid)
        );
        const tournamentsSnapshot = await getDocs(tournamentsQuery);
        console.log(`Found ${tournamentsSnapshot.docs.length} tournaments to delete`);
        
        if (tournamentsSnapshot.docs.length > 0) {
          try {
            const tournamentDeletions = tournamentsSnapshot.docs.map(doc => {
              console.log(`Deleting tournament: ${doc.id}`);
              return deleteDoc(doc.ref);
            });
            await Promise.all(tournamentDeletions);
            console.log("All tournaments deleted successfully");
          } catch (tournamentError) {
            console.warn("Error deleting tournaments, but continuing with account deletion:", tournamentError);
            // Continue with deletion process even if tournament deletion fails
          }
        }
        
        // Try to delete user data from Firestore, but continue even if it fails
        try {
          console.log("Deleting user profile from Firestore...");
          const userRef = doc(db, 'users', user.uid);
          await deleteDoc(userRef);
          console.log("User profile deleted from Firestore");
        } catch (firestoreError) {
          console.warn("Error deleting user profile from Firestore, but continuing with account deletion:", firestoreError);
          // Continue with auth deletion even if Firestore deletion fails due to permissions
        }
        
        // Delete Firebase Auth user
        console.log("Deleting Firebase Auth user...");
        await user.delete();
        console.log("Firebase Auth user deleted successfully");
        
        // Show success message
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted"
        });
        
        // Redirect to auth page
        navigate("/auth");
      } catch (deleteError: any) {
        console.error("Error during deletion steps:", deleteError);
        
        // Handle specific Firebase errors
        if (deleteError.code === 'auth/requires-recent-login') {
          setReAuthError("For security reasons, please sign out and sign in again before deleting your account.");
          await logout();
          return;
        }
        
        throw deleteError;
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      
      // More detailed error message based on error type
      let errorMessage = "An error occurred while deleting your account";
      
      if (error.code) {
        switch(error.code) {
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many requests. Please try again later.";
            break;
          case 'auth/user-token-expired':
            errorMessage = "Your session has expired. Please log in again.";
            break;
          case 'auth/missing-permissions':
          case 'permission-denied':
            errorMessage = "Permission denied. Please contact the administrator.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error deleting account",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsReauthenticating(false);
      setShowDeleteConfirm(false);
      setPassword("");
    }
  };

  const handleEmailPasswordReauth = async () => {
    try {
      setIsReauthenticating(true);
      
      // Get current user
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw new Error("No user is currently signed in or has no email");
      }
      
      console.log("Attempting to reauthenticate user with email:", user.email);
      
      try {
        // Reauthenticate user before deletion (Firebase security requirement)
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        console.log("Reauthentication successful");
        
        // Proceed with deletion after successful reauthentication
        await handleDeleteAccountAfterReauth();
      } catch (authError: any) {
        // Handle reauthentication error
        console.error("Auth error:", authError);
        
        if (authError.code === 'auth/wrong-password') {
          setReAuthError("Incorrect password. Please try again.");
        } else if (authError.code === 'auth/too-many-requests') {
          setReAuthError("Too many attempts. Please try again later.");
        } else if (authError.code === 'auth/network-request-failed') {
          setReAuthError("Network error. Please check your connection.");
        } else {
          setReAuthError(authError.message || "Authentication failed. Please try again.");
        }
        
        setIsReauthenticating(false);
      }
    } catch (error) {
      console.error("Email reauthentication process error:", error);
      setReAuthError("An unexpected error occurred. Please try again.");
      setIsReauthenticating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setReAuthError("");
      
      // Get current user
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("No user is currently signed in");
      }
      
      // Get provider data
      const providerData = user.providerData;
      const isGoogleUser = providerData.some(
        provider => provider.providerId === 'google.com'
      );
      const isEmailUser = providerData.some(
        provider => provider.providerId === 'password'
      );
      
      if (isEmailUser) {
        // For email/password users, we need to re-authenticate with password
        await handleEmailPasswordReauth();
      } else if (isGoogleUser) {
        // For Google users, we need to re-authenticate with Google
        await handleGoogleReauth();
      } else {
        // For other providers or if no provider identified
        throw new Error("Couldn't determine authentication method. Please log out and log back in before trying again.");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Error deleting account",
        description: error instanceof Error ? error.message : "An error occurred while deleting your account",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  const settingsItems = [
    { 
      id: "profile",
      icon: <Edit size={20} className="text-gaming-primary" />,
      title: "Edit Profile", 
      description: "Update your personal information" 
    },
    { 
      id: "tournaments",
      icon: <Trophy size={20} className="text-gaming-accent" />,
      title: "My Tournaments", 
      description: "Tournaments you've joined or hosted",
      action: () => navigate("/tournaments")
    },
    { 
      id: "password",
      icon: <Lock size={20} className="text-[#ec4899]" />,
      title: "Change Password", 
      description: "Update your login password" 
    },
    { 
      id: "apply-host",
      icon: <Crown size={20} className="text-yellow-400" />,
      title: "Apply as Host", 
      description: "Become a verified tournament host",
      action: () => navigate('/apply-host')
    },
    { 
      id: "support",
      icon: <MessageSquare size={20} className="text-[#8b5cf6]" />,
      title: "Contact Support", 
      description: "Help & support" 
    },
    { 
      id: "delete",
      icon: <Trash2 size={20} className="text-red-500" />,
      title: "Delete Account", 
      description: "Permanently delete your account", 
      // isDestructive: true // Removed as SettingsItem doesn't use it
    }
  ];

  return (
    <ProfileEditSheetContext.Provider value={{ openProfileEdit }}>
      <div className="min-h-screen bg-gaming-bg text-gaming-text pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8 max-w-4xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-gaming-muted hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-gaming-primary" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side: Profile Card */}
            <div className="md:col-span-1">
              <Card 
                className="bg-gaming-card border-gaming-border text-center p-6 relative overflow-hidden cursor-pointer hover:bg-gaming-card/80 transition-colors"
                onClick={() => navigate('/profile')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
                
                <div className="relative">
                  <AvatarDisplay
                    userProfile={userProfile}
                    currentUser={currentUser}
                    className="w-24 h-24 mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  <p className="text-sm text-gaming-muted">UID: {user.uid}</p>
                  
                  {user.isHost && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-gaming-primary/20 text-gaming-primary px-2 py-1 rounded-full text-xs font-semibold">
                      <Crown size={12} />
                      Verified Host
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Right side: Settings List */}
            <div className="md:col-span-2">
              <Card className="bg-gaming-card border-gaming-border p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gaming-primary/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gaming-accent/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                
                <div className="relative space-y-2">
                  {settingsItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <SettingsItem
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        // isDestructive={item.isDestructive} // Removed as SettingsItem doesn't use it
                        onClick={item.action ? item.action : () => handleOpenSheet(item.id)}
                      />
                      {index < settingsItems.length - 1 && <Separator className="bg-gaming-border/50" />}
                    </React.Fragment>
                  ))}
                  <Separator className="bg-gaming-border/50" />
                  <SettingsItem
                    icon={<LogOut size={20} className="text-red-500" />}
                    title="Logout"
                    description="Sign out of your account"
                    onClick={handleLogout}
                  />
                </div>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Sheets for different settings */}
        <Sheet open={openSheet === 'profile'} onOpenChange={(isOpen) => !isOpen && handleCloseSheet()}>
          <SheetContent 
            side={isMobile ? "bottom" : "right"} 
            className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
            style={{
              maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
              paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
            }}
          >
            <div className="h-full flex flex-col">
              {isMobile && (
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <p className="text-sm text-gaming-muted">Update your personal information</p>
              </div>
              
              <div className="flex-1 overflow-auto pb-10">
                <ProfileEditForm onClose={handleCloseSheet} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sheet for Password */}
        <Sheet open={openSheet === "password"} onOpenChange={handleCloseSheet}>
          <SheetContent 
            side={isMobile ? "bottom" : "right"} 
            className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
            style={{
              maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
              paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
            }}
          >
            <div className="h-full flex flex-col">
              {isMobile && (
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Change Password</h2>
                <p className="text-sm text-gaming-muted">Update your account password</p>
              </div>
              
              <div className="flex-1 overflow-auto">
                <ChangePasswordForm onClose={handleCloseSheet} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sheet for Contact Support */}
        <Sheet open={openSheet === "support"} onOpenChange={handleCloseSheet}>
          <SheetContent 
            side={isMobile ? "bottom" : "right"} 
            className="bg-gaming-bg border-gaming-border max-h-[90vh] overflow-y-auto p-4 rounded-t-xl bottom-sheet-ios-fix"
            style={{
              maxHeight: isMobile ? 'calc(90vh - env(safe-area-inset-bottom))' : '90vh',
              paddingBottom: isMobile ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem',
            }}
          >
            <div className="h-full flex flex-col">
              {isMobile && (
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Contact Support</h2>
                <p className="text-sm text-gaming-muted">Questions, feedback, or bug reports</p>
              </div>
              
              <div className="flex-1 overflow-auto">
                <ContactSupportForm onClose={handleCloseSheet} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ProfileEditSheetContext.Provider>
  );
};

const ChangePasswordForm = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const { changeUserPassword } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Password validation regex patterns
  const hasLowerCase = /[a-z]/;
  const hasUpperCase = /[A-Z]/;
  const hasNumber = /[0-9]/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    // Validate current password
    if (!form.currentPassword) {
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    // Validate new password
    if (!form.newPassword) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else if (form.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
      isValid = false;
    } else if (!hasLowerCase.test(form.newPassword)) {
      errors.newPassword = "Password must include a lowercase letter";
      isValid = false;
    } else if (!hasUpperCase.test(form.newPassword)) {
      errors.newPassword = "Password must include an uppercase letter";
      isValid = false;
    } else if (!hasNumber.test(form.newPassword)) {
      errors.newPassword = "Password must include a number";
      isValid = false;
    } else if (!hasSpecialChar.test(form.newPassword)) {
      errors.newPassword = "Password must include a special character";
      isValid = false;
    } else if (form.currentPassword === form.newPassword) {
      errors.newPassword = "New password must be different from current password";
      isValid = false;
    }

    // Validate confirm password
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
      isValid = false;
    } else if (form.newPassword !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Firebase changePassword function
      await changeUserPassword(form.currentPassword, form.newPassword);

      // Show success message
      toast({
        title: "Password updated!",
        description: "Your password has been successfully changed.",
      });

      // Reset form and close dialog
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFormErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    } catch (error: any) {
      console.error('Password change error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = "Failed to update password. Please try again.";
      
      if (error.message === "Current password is incorrect") {
        setFormErrors({
          ...formErrors,
          currentPassword: "Current password is incorrect",
        });
        errorMessage = "Current password is incorrect.";
      } else if (error.message === "New password is too weak") {
        setFormErrors({
          ...formErrors,
          newPassword: "Password is too weak",
        });
        errorMessage = "New password is too weak.";
      } else if (error.message === "Please sign out and sign in again before changing your password") {
        errorMessage = "Please sign out and sign in again before changing your password.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all fields are filled and valid
  const isFormValid = 
    form.currentPassword.trim() !== "" && 
    form.newPassword.trim() !== "" && 
    form.confirmPassword.trim() !== "" && 
    !formErrors.currentPassword && 
    !formErrors.newPassword && 
    !formErrors.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-[#A0AEC0]">
          Current Password
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showPassword.currentPassword ? "text" : "password"}
            value={form.currentPassword}
            onChange={handleChange}
            className={`bg-[#101010] border-[#2D3748] text-white pr-10 ${
              formErrors.currentPassword ? "border-[#EF4444] focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#1E3A8A]"
            }`}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-[#A0AEC0] hover:text-white"
            onClick={() => togglePasswordVisibility("currentPassword")}
          >
            {showPassword.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {formErrors.currentPassword && (
          <p className="text-[#EF4444] text-xs flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            {formErrors.currentPassword}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs text-[#22C55E] hover:text-[#22C55E]/80 hover:underline transition-colors focus:outline-none"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-[#A0AEC0]">
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showPassword.newPassword ? "text" : "password"}
            value={form.newPassword}
            onChange={handleChange}
            className={`bg-[#101010] border-[#2D3748] text-white pr-10 ${
              formErrors.newPassword ? "border-[#EF4444] focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#1E3A8A]"
            }`}
            placeholder="Enter your new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-[#A0AEC0] hover:text-white"
            onClick={() => togglePasswordVisibility("newPassword")}
          >
            {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {formErrors.newPassword && (
          <p className="text-[#EF4444] text-xs flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            {formErrors.newPassword}
          </p>
        )}
        {!formErrors.newPassword && form.newPassword && (
          <p className="text-[#22C55E] text-xs flex items-center gap-1 mt-1">
            <Check size={12} />
            Password meets requirements
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[#A0AEC0]">
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword.confirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            className={`bg-[#101010] border-[#2D3748] text-white pr-10 ${
              formErrors.confirmPassword ? "border-[#EF4444] focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#1E3A8A]"
            }`}
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-[#A0AEC0] hover:text-white"
            onClick={() => togglePasswordVisibility("confirmPassword")}
          >
            {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {formErrors.confirmPassword && (
          <p className="text-[#EF4444] text-xs flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            {formErrors.confirmPassword}
          </p>
        )}
        {!formErrors.confirmPassword && form.confirmPassword && form.confirmPassword === form.newPassword && (
          <p className="text-[#22C55E] text-xs flex items-center gap-1 mt-1">
            <Check size={12} />
            Passwords match
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-transparent border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748] hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Changing Password..." : "Change Password"}
        </Button>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword}
      />
    </form>
  );
};

export default Settings;
