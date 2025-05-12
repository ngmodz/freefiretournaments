import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gaming-bg">
      <div className="text-center p-8 bg-gaming-card rounded-lg shadow-lg max-w-md">
        <h1 className="text-7xl font-bold mb-4 text-gaming-primary">404</h1>
        <p className="text-xl text-gaming-text mb-6">Oops! Page not found</p>
        <p className="text-gaming-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/home">
          <Button className="bg-gaming-primary hover:bg-gaming-primary-dark">
            <Home size={16} className="mr-2" /> Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
