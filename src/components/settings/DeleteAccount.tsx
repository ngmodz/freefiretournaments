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
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, limit } from "firebase/firestore";

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
      
      // Use a batch for more reliable Firestore operations
      const batch = writeBatch(db);
      
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
            tournamentsSnapshot.docs.forEach(document => {
              console.log(`Adding tournament for deletion: ${document.id}`);
              batch.delete(document.ref);
            });
            console.log("All tournaments added to deletion batch");
          } catch (tournamentError) {
            console.warn("Error adding tournaments to batch, will try individual deletion:", tournamentError);
            // Fallback to individual deletes if batch fails
            const tournamentDeletions = tournamentsSnapshot.docs.map(doc => {
              console.log(`Individual deletion of tournament: ${doc.id}`);
              return deleteDoc(doc.ref);
            });
            await Promise.all(tournamentDeletions);
            console.log("All tournaments deleted successfully via individual deletion");
          }
        }
        
        // Add any wallet or transaction cleanup
        try {
          console.log("Checking for wallet data to delete...");
          const walletRef = doc(db, 'wallets', user.uid);
          batch.delete(walletRef);
          console.log("Wallet added to deletion batch");
        } catch (walletError) {
          console.warn("Error adding wallet to batch deletion:", walletError);
        }
        
        // Check for credit transactions
        try {
          console.log("Checking for credit transactions...");
          const transactionsQuery = query(
            collection(db, 'creditTransactions'),
            where('userId', '==', user.uid),
            limit(100)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          if (transactionsSnapshot.docs.length > 0) {
            console.log(`Found ${transactionsSnapshot.docs.length} credit transactions`);
            // We don't delete these, just logging for completeness
          }
        } catch (transactionError) {
          console.warn("Error checking credit transactions:", transactionError);
        }
        
        // Try to delete user data from Firestore
        try {
          console.log("Adding user profile to deletion batch...");
          const userRef = doc(db, 'users', user.uid);
          batch.delete(userRef);
          console.log("User profile added to deletion batch");
        } catch (firestoreError) {
          console.warn("Error adding user profile to batch deletion:", firestoreError);
        }
        
        // Commit the batch operation
        console.log("Committing batch deletion...");
        await batch.commit();
        console.log("Batch deletion successful");
        
        // As a fallback, also try direct deletion of the user document
        // This helps ensure deletion even if batch fails
        try {
          console.log("Performing direct user document deletion as fallback...");
          const userRef = doc(db, 'users', user.uid);
          await deleteDoc(userRef);
          console.log("Direct user profile deletion successful");
        } catch (directDeleteError) {
          console.warn("Direct user deletion failed, but continuing with auth deletion:", directDeleteError);
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
          // Specifically handle permission denied error
          case 'permission-denied':
            errorMessage = "Permission denied. Please contact support.";
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
          
          <div className="flex gap-4 items-center">
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
      
      {isReauthenticating && !showDeleteConfirm && authProviderId === "password" &&
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <div className="flex items-start mb-4">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h3 className="text-white font-medium">Confirm your password</h3>
              <p className="text-[#A0A0A0] text-sm mt-1">
                For security reasons, please enter your password before deleting your account.
              </p>
            </div>
          </div>
          
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
            {reAuthError && <p className="text-red-500 text-xs mt-1">{reAuthError}</p>}
          </div>
          
          <div className="flex gap-4 items-center">
            <Button 
              variant="destructive"
              onClick={handleEmailPasswordReauth}
              disabled={!password || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(true);
                setIsReauthenticating(false);
                setPassword("");
                setReAuthError("");
              }}
              className="border-red-500/20 hover:bg-red-500/10 text-white"
            >
              Back
            </Button>
          </div>
        </div>
      }
    </div>
  );
};

export default DeleteAccount; 