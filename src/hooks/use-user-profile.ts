import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getUserProfile,
  updateUserProfile,
} from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  uid: string;
  ign: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  birthdate: string;
  gender: string;
  isPremium: boolean;
  joinDate: string;
}

interface ProfileUpdate {
  ign?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
  gender?: string;
  uid?: string;
}

interface UseUserProfileReturn {
  loading: boolean;
  user: UserProfile | null;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  error: string | null;
}

export function useUserProfile(): UseUserProfileReturn {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth(); // Get current user from AuthContext

  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (currentUser) {
          console.log("Found authenticated user:", currentUser.uid);
          await fetchUserProfile(currentUser.uid);
        } else {
          console.log("No authenticated user found");
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
        console.error('Error initializing user:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
    
  }, [currentUser]); // Add currentUser as a dependency

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(userId);
      
      if (userProfile) {
        setUser({
          id: userProfile.id,
          uid: userProfile.uid,
          ign: userProfile.ign,
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          birthdate: userProfile.birthdate || '',
          gender: userProfile.gender || '',
          isPremium: userProfile.isPremium,
          joinDate: userProfile.created_at ? new Date(userProfile.created_at.toDate()).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          }) : '',
        });
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      console.error('Error loading profile from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: ProfileUpdate) => {
    if (!currentUser) {
      const errorMsg = 'User not authenticated';
      console.error(errorMsg, { currentAuthUser: currentUser, profileUser: user });
      setError(errorMsg);
      toast({
        title: 'Update Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update profile in Firestore
      console.log("Updating profile in Firestore for user:", currentUser.uid, updates);
      
      // Always use the current authenticated user's ID from AuthContext
      await updateUserProfile(currentUser.uid, updates);
      
      // Fetch updated profile
      await fetchUserProfile(currentUser.uid);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    user,
    updateProfile,
    error,
  };
} 