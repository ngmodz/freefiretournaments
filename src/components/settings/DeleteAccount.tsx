import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  GoogleAuthProvider,
  signInWithPopup, 
  getAuth
} from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, googleSignIn, currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [reAuthError, setReAuthError] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [authProviderId, setAuthProviderId] = useState<string>("");

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

  const handleEmailPasswordReauth = async () => {
    if (!password) {
      setReAuthError("Please enter your password");
      return;
    }
    
    try {
      setIsReauthenticating(true);
      setReAuthError("");
      
      if (!currentUser?.email) {
        throw new Error("No email found for this account");
      }
      
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      await handleDeleteAccountAfterReauth();
    } catch (error: any) {
      console.error("Email/password reauth error:", error);
      let errorMessage = "Authentication failed. Please check your password and try again.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many unsuccessful attempts. Please try again later.";
      } else if (error.code === 'auth/user-mismatch') {
        errorMessage = "The credentials don't match the user trying to delete the account.";
      }
      
      setReAuthError(errorMessage);
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
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setReAuthError("");
      setIsReauthenticating(false);
      setIsDeleting(false);
      
      toast({
        title: "Account deletion failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      // Verify deletion text matches expectation
      if (deleteText !== "DELETE") {
        toast({
          title: "Deletion canceled",
          description: "Please type DELETE to confirm account deletion",
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }
      
      // Check if user is signed in
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be signed in to delete your account");
      }
      
      // Get the provider ID to determine reauth method
      const providerData = user.providerData;
      if (providerData.length === 0) {
        throw new Error("Authentication provider information not available");
      }
      
      const providerId = providerData[0].providerId;
      setAuthProviderId(providerId);
      console.log("Provider ID:", providerId);
      
      if (providerId === "google.com") {
        // Google account - need Google reauth
        await handleGoogleReauth();
      } else if (providerId === "password") {
        // Email/password account - show password reauth form
        setShowDeleteConfirm(false);
        setReAuthError("");
        setIsReauthenticating(true);
      } else {
        // Other providers
        setReAuthError(`Authentication with ${providerId} is not supported for account deletion`);
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while processing your request",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-red-500/10 p-3 rounded-md border border-red-500/30">
        <div className="flex items-center space-x-3">
          <Trash2 className="text-red-500 h-5 w-5" />
          <h3 className="text-lg font-medium text-white">Delete Account</h3>
        </div>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="transition-all hover:-translate-y-1 hover:shadow-lg duration-200"
        >
          Delete
        </Button>
      </div>
      
      {showDeleteConfirm && (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <div className="flex items-start mb-4">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h3 className="text-white font-medium">Delete account permanently?</h3>
              <p className="text-[#A0A0A0] text-sm mt-1">
                This action cannot be undone. All your data, including tournaments, wallet balance,
                and profile information will be permanently deleted.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="delete-confirm" className="text-white block mb-2">
              Type <span className="font-bold text-red-500">DELETE</span> to confirm:
            </Label>
            <Input
              id="delete-confirm"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="border-red-500/50 bg-red-950/20 text-white"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteText !== "DELETE" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteText("");
              }}
              className="border-red-500/20 hover:bg-red-500/10 text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {isReauthenticating && !showDeleteConfirm && authProviderId === "password" && (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <div className="flex items-start mb-4">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h3 className="text-white font-medium">Confirm your password</h3>
              <p className="text-[#A0A0A0] text-sm mt-1">
                For security reasons, please enter your password to confirm account deletion.
              </p>
            </div>
          </div>
          
          {reAuthError && (
            <div className="p-3 mb-3 bg-red-500/20 border border-red-500/30 rounded-md text-white text-sm">
              {reAuthError}
            </div>
          )}
          
          <div className="mb-4">
            <Label htmlFor="password-confirm" className="text-white block mb-2">
              Password:
            </Label>
            <Input
              id="password-confirm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-red-500/50 bg-red-950/20 text-white"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="destructive"
              onClick={handleEmailPasswordReauth}
              disabled={!password || isReauthenticating}
            >
              {isReauthenticating ? "Verifying..." : "Continue with Deletion"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsReauthenticating(false);
                setPassword("");
                setReAuthError("");
              }}
              className="border-red-500/20 hover:bg-red-500/10 text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccount; 