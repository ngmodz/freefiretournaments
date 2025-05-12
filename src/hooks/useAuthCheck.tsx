import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to check authentication status and redirect if needed
 * @param requireAuth - If true, redirect to /auth if not authenticated
 * @param redirectIfAuthenticated - If true, redirect to / if authenticated
 * @param redirectPath - Custom redirect path
 * @returns An object with authentication status
 */
export function useAuthCheck(options: {
  requireAuth?: boolean;
  redirectIfAuthenticated?: boolean;
  redirectPath?: string;
} = {}) {
  const { requireAuth = false, redirectIfAuthenticated = false, redirectPath } = options;
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const isAuthenticated = !!currentUser;
      
      if (requireAuth && !isAuthenticated) {
        // Redirect to auth page if authentication is required but user is not authenticated
        navigate(redirectPath || '/auth');
      } else if (redirectIfAuthenticated && isAuthenticated) {
        // Redirect to home if user is authenticated but shouldn't be on this page
        navigate(redirectPath || '/home');
      }
      
      setIsChecking(false);
    }
  }, [currentUser, isLoading, navigate, redirectIfAuthenticated, requireAuth, redirectPath]);

  return {
    isAuthenticated: !!currentUser,
    isLoading: isLoading || isChecking,
    currentUser
  };
}

export default useAuthCheck; 