import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { ChevronLeft, CalendarIcon, Users, Trophy, MapPin, Settings, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createTournament } from "@/lib/tournamentService";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useTournament } from "@/contexts/TournamentContext";
import { useCreditBalance } from '@/hooks/useCreditBalance';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useHostCredit } from '@/lib/walletService';
import { useAuth } from "@/contexts/AuthContext";
import { useProfileEditSheet } from "@/contexts/ProfileEditSheetContext";

// Array of banner images to randomly assign to tournaments
const bannerImages = [
  "https://iili.io/3v8Y6nS.jpg", // photo 1627856013091
  "https://iili.io/3v8Yrt2.jpg", // photo 1598550476439
  "https://iili.io/3v8YUu4.jpg", // photo 1563089145
  "https://iili.io/3v8Yv8G.jpg", // photo 1560253023
  "https://iili.io/3v8Ykas.jpg", // photo 1542751371
  "https://iili.io/3v8YN6X.jpg", // photo 1511512578047
  "https://iili.io/3v8YjnI.jpg", // photo 1511882150382
  "https://iili.io/3v8YXZN.jpg", // photo 1550745165
  "https://iili.io/3v8YWjp.jpg", // photo 1616588589676
  "https://iili.io/3v8YVuR.jpg", // photo 1603481546238
];

interface ReviewAndPublishProps {
  formData: TournamentFormData;
  prevStep: () => void;
}

const ReviewAndPublish = ({ formData, prevStep }: ReviewAndPublishProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const { refreshHostedTournaments } = useTournament();
  // Generate a truly random banner index when component mounts 
  // Use useEffect to ensure it's random on each render
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hostCreditError, setHostCreditError] = useState<string | null>(null);
  const { currentUser, userProfile } = useAuth();
  const { openProfileEdit } = useProfileEditSheet();
  const { hostCredits, isLoading: isHostCreditsLoading } = useCreditBalance(currentUser?.uid);
  const [showIgnDialog, setShowIgnDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<{ ign: boolean; uid: boolean }>({ ign: false, uid: false });
  
  useEffect(() => {
    // Generate a random index between 0 and bannerImages.length-1
    const randomIndex = Math.floor(Math.random() * bannerImages.length);
    setSelectedBannerIndex(randomIndex);
    console.log("Selected random banner index:", randomIndex);
  }, []);
  
  // Function to change the banner image
  const changeBannerImage = () => {
    const newIndex = (selectedBannerIndex + 1) % bannerImages.length;
    setSelectedBannerIndex(newIndex);
    console.log("Changed banner index to:", newIndex);
  };
  
  // Verify authentication status on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in with UID:", user.uid);
        setAuthVerified(true);
      } else {
        console.log("No user is signed in");
        setError("You must be logged in to create a tournament. Please sign in again.");
        setAuthVerified(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Calculate total prize pool
  const totalPrizePool = formData.entry_fee * formData.max_players;
  const totalPrizeCredits = Object.values(formData.prize_distribution).reduce((sum, value) => sum + value, 0);
  const hostEarnings = Math.max(0, totalPrizePool - totalPrizeCredits);

  // Format date from ISO string
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Date not set";
    }
  };
  
  // Helper to render prize distribution
  const renderPrizeDistribution = () => {
    return Object.entries(formData.prize_distribution)
      .filter(([_, credits]) => credits > 0)
      .map(([position, credits]) => (
        <div key={position} className="flex justify-between items-center text-sm">
          <span>{position} Place</span>
          <span className="text-gaming-accent font-semibold">{credits} credits</span>
        </div>
      ));
  };

  // Validate tournament data
  const validateTournamentData = (): boolean => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      setError("You must be logged in to create a tournament. Please sign in.");
      return false;
    }
    
    // Check required fields
    const requiredFields: (keyof TournamentFormData)[] = [
      'name', 'description', 'mode', 'max_players', 'start_date', 
      'map', 'room_type', 'entry_fee', 'prize_distribution', 'rules'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check if date is in the future
    const tournamentDate = new Date(formData.start_date);
    const now = new Date();
    if (tournamentDate <= now) {
      setError("Tournament start date must be in the future");
      return false;
    }
    
    // Validate prize distribution (credits mode)
    const totalPrizeCredits = Object.values(formData.prize_distribution).reduce((sum, value) => sum + value, 0);
    if (totalPrizeCredits > totalPrizePool) {
      setError(`Total prize credits cannot exceed the total expected prize pool. Current total: ${totalPrizeCredits}`);
      return false;
    }
    
    return true;
  };

  // Re-authenticate user if needed
  const refreshAuthentication = async () => {
    try {
      // Sign out and redirect to auth page to refresh authentication
      await signOut(auth);
      toast.error("Authentication session expired. Please log in again.");
      navigate("/auth");
      return false;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  // Modified handler to show dialog
  const handlePublishClick = () => {
    setHostCreditError(null);
    setShowConfirmDialog(true);
  };

  // Modified createTournamentHandler to accept a flag for dialog
  const createTournamentHandler = async (fromDialog = false) => {
    try {
      setError(null);
      if (!authVerified) {
        const isRefreshed = await refreshAuthentication();
        if (!isRefreshed) return;
      }
      if (!validateTournamentData()) {
        return;
      }
      // --- IGN/UID validation (frontend) ---
      const ignMissing = !userProfile?.ign || userProfile.ign.length < 3;
      const uidMissing = !userProfile?.uid || !/^[0-9]{8,12}$/.test(userProfile.uid);
      if (ignMissing || uidMissing) {
        setMissingFields({ ign: ignMissing, uid: uidMissing });
        setShowIgnDialog(true);
        return;
      }
      // --- END IGN/UID validation ---
      // Host credit check only if from dialog
      if (fromDialog) {
        if (isHostCreditsLoading) return;
        if (hostCredits < 1) {
          setHostCreditError('You need to add Host Credits before hosting a tournament.');
          return;
        }
      }
      setIsSubmitting(true);
      const toastId = toast.loading('Creating your tournament...');
      try {
        // Create the tournament in Firestore
        const result = await createTournament(formData);
        // Deduct host credit if from dialog
        if (fromDialog && currentUser) {
          const useHostCreditResult = await useHostCredit(currentUser.uid, result.id, formData.name);
          if (!useHostCreditResult.success) {
            toast.error('Failed to deduct Host Credit. Please contact support.', { id: toastId });
          }
        }
        setSuccess(true);
        toast.success('Tournament created successfully!', {
          id: toastId,
          position: 'top-center',
          className: 'mobile-toast-success',
          duration: 3000,
          description: 'Redirecting to tournament page...'
        });
        await refreshHostedTournaments();
        setTimeout(() => {
          navigate(`/tournament/${result.id}`);
        }, 2000);
      } catch (innerError) {
        const errorMessage = innerError instanceof Error ? innerError.message : 'Failed to create tournament. Please try again.';
        toast.error(errorMessage, {
          id: toastId,
          position: 'top-center',
          className: 'mobile-toast-error',
          duration: 4000
        });
        throw innerError;
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tournament. Please try again.';
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        toast.error('Permission issue detected. Refreshing your authentication...');
        await refreshAuthentication();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Review & Publish Tournament</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!authVerified && (
        <Alert className="mb-6 bg-amber-500/20 border-amber-500 text-amber-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Warning</AlertTitle>
          <AlertDescription>
            Your authentication session may be invalid. Creating a tournament might fail. Please consider signing out and signing back in.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Tournament Date Warning */}
      {formData.start_date && new Date(formData.start_date) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
        <Alert className="mb-6 bg-amber-500/20 border-amber-500 text-amber-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Your tournament is scheduled to start in less than 24 hours. Participants may not have enough time to join.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="relative z-10">
          {/* Tournament Header */}
          <div className="relative rounded-md overflow-hidden h-40 mb-4">
            {/* Banner Image */}
            <img 
              src={bannerImages[selectedBannerIndex]}
              alt={formData.name}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
            
            {/* New Banner Change Button */}
            <Button
              type="button"
              onClick={changeBannerImage}
              className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded-md"
            >
              Change Banner
            </Button>
            
            <div className="absolute bottom-4 left-4 z-20">
              <h3 className="text-xl font-bold text-white">{formData.name}</h3>
              <div className="flex items-center text-white/80 text-sm">
                <CalendarIcon size={14} className="mr-1" />
                <span>{formData.start_date ? formatDate(formData.start_date) : "Date not set"}</span>
              </div>
            </div>
          </div>
          
          {/* Tournament Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="bg-gaming-bg/50 rounded-lg p-4 border border-white/5 backdrop-blur-sm">
              <h4 className="font-semibold mb-3 flex items-center">
                <Users size={16} className="mr-2 text-gaming-primary" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Game Mode:</span>
                  <span>{formData.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Max Players:</span>
                  <span>{formData.max_players}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Description:</span>
                </div>
                <p className="text-sm text-gaming-muted">{formData.description}</p>
              </div>
              
              <h4 className="font-semibold mb-3 flex items-center">
                <MapPin size={16} className="mr-2 text-gaming-primary" />
                Game Settings
              </h4>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Map:</span>
                  <span>{formData.map}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Room Type:</span>
                  <span>{formData.room_type}</span>
                </div>
                <Separator className="my-2" />
                <h5 className="font-medium">Custom Settings:</h5>
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Auto-Aim:</span>
                  <span>{formData.custom_settings.auto_aim ? "Enabled" : "Disabled"}</span>
                </div>
                {formData.custom_settings.fall_damage !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gaming-muted">Fall Damage:</span>
                    <span>{formData.custom_settings.fall_damage ? "Enabled" : "Disabled"}</span>
                  </div>
                )}
                {formData.custom_settings.friendly_fire !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gaming-muted">Friendly Fire:</span>
                    <span>{formData.custom_settings.friendly_fire ? "Enabled" : "Disabled"}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column */}
            <div className="bg-gaming-bg/50 rounded-lg p-4 border border-white/5 backdrop-blur-sm">
              <h4 className="font-semibold mb-3 flex items-center">
                <Trophy size={16} className="mr-2 text-gaming-primary" />
                Entry Fee & Prizes
              </h4>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Entry Fee:</span>
                  <span className="font-semibold">{formData.entry_fee} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gaming-muted">Expected Prize Pool:</span>
                  <span className="font-semibold text-gaming-accent">{totalPrizePool} credits</span>
                </div>
                <Separator className="my-2" />
                <h5 className="font-medium">Prize Distribution:</h5>
                <div className="space-y-2 mt-2">
                  {renderPrizeDistribution()}
                </div>
                <div className="mt-2">
                  <span className="font-semibold text-green-400">Host Earnings:</span> <span className="font-semibold text-green-300">{hostEarnings}</span> credits
                </div>
              </div>
              
              <h4 className="font-semibold mb-3 flex items-center">
                <Settings size={16} className="mr-2 text-gaming-primary" />
                Tournament Rules
              </h4>
              <div className="bg-gaming-card/70 rounded-md p-3 text-sm text-gaming-muted mb-4">
                {formData.rules ? (
                  <ul className="list-decimal pl-5 space-y-1 text-left">
                    {formData.rules.split(/\n/).filter(rule => rule.trim()).map((rule, idx) => (
                      <li key={idx}>{rule.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <span>No rules specified</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={isSubmitting || success}
              className="border-gaming-primary text-gaming-primary w-full sm:w-auto order-2 sm:order-1 py-6 sm:py-2 rounded-xl sm:rounded-md text-base"
            >
              <ChevronLeft size={18} className="mr-2" /> Back to Edit
            </Button>
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button"
                  onClick={handlePublishClick}
                  disabled={isSubmitting || success}
                  className="bg-gaming-primary hover:bg-gaming-primary/90 w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Tournament'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Hosting</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hosting a tournament will cost <b>1 Host Credit</b>.<br />
                    {isHostCreditsLoading ? 'Checking your balance...' : `You currently have ${hostCredits} Host Credit${hostCredits !== 1 ? 's' : ''}.`}
                    <br />Do you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isSubmitting || isHostCreditsLoading} onClick={() => createTournamentHandler(true)}>
                    Yes, Host Tournament
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      {hostCreditError && (
        <div className="flex justify-center w-full mb-6 mt-8">
          <Alert
            variant="destructive"
            className="bg-red-100 border border-red-300 text-red-700 max-w-md w-full"
            style={{
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              minHeight: 'unset',
              boxShadow: 'none',
              display: 'block',
            }}
          >
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-4 w-4 text-red-400 mb-1" />
              <AlertTitle className="text-base font-semibold mb-1 text-center w-full">Error</AlertTitle>
            </div>
            <AlertDescription className="text-sm font-normal leading-tight text-left w-full mt-1">
              {hostCreditError}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {/* IGN/UID Required Dialog */}
      <AlertDialog open={showIgnDialog} onOpenChange={setShowIgnDialog}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle className="text-lg sm:text-xl">
              {missingFields.ign && missingFields.uid
                ? "Complete Your Profile"
                : missingFields.ign
                ? "IGN Required"
                : "UID Required"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {missingFields.ign && missingFields.uid ? (
                <>
                  To host tournaments, please update your <b>IGN</b> (in-game name) and <b>UID</b> (8-12 digit Free Fire ID) in your profile.
                </>
              ) : missingFields.ign ? (
                <>Complete your profile by adding your <b>IGN</b> (in-game name) to host tournaments.</>
              ) : (
                <>Complete your profile by adding your <b>UID</b> (8-12 digit Free Fire ID) to host tournaments.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <AlertDialogCancel 
              onClick={() => setShowIgnDialog(false)}
              className="order-2 sm:order-1 w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { setShowIgnDialog(false); openProfileEdit(); }}
              className="order-1 sm:order-2 w-full sm:w-auto bg-gaming-primary hover:bg-gaming-primary/90"
            >
              Update Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewAndPublish; 