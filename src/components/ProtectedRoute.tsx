import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/lib/adminService";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminRoute?: boolean;
}

export function ProtectedRoute({ children, adminRoute = false }: ProtectedRouteProps) {
  const { currentUser, userProfile, isLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(adminRoute);

  // Check admin status for admin routes
  useEffect(() => {
    if (!adminRoute || !currentUser) {
      setAdminCheckLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const adminStatus = await AdminService.checkAdminStatus(currentUser.uid);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [adminRoute, currentUser]);

  // Show loading state while checking authentication or admin status
  if (isLoading || adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page with the attempted location
  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If it's an admin route, check for admin privileges
  if (adminRoute && !isAdmin) {
    // Redirect non-admins from admin routes
    return <Navigate to="/home" replace />;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
}

export default ProtectedRoute;
