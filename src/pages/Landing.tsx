import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Landing = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gaming-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If the user is authenticated, navigate to home, otherwise to auth
  return <Navigate to={currentUser ? "/home" : "/auth"} replace />;
};

export default Landing; 