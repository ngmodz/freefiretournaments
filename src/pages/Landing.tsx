import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Landing = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gaming-bg">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
      </div>
    );
  }

  // If the user is authenticated, navigate to home, otherwise to auth
  return <Navigate to={currentUser ? "/home" : "/auth"} replace />;
};

export default Landing; 