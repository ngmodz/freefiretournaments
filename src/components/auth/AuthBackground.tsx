import { ReactNode } from "react";

interface AuthBackgroundProps {
  children: ReactNode;
}

const AuthBackground = ({ children }: AuthBackgroundProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gaming-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gaming-primary/10 rounded-full filter blur-3xl opacity-30 animate-pulse-glow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gaming-accent/10 rounded-full filter blur-3xl opacity-30 animate-pulse-glow"></div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        {children}
      </div>
      
      <footer className="py-4 text-center text-sm text-gaming-text/50 relative z-10">
        <p>© 2025 Free Fire Tournaments - Not affiliated with Garena</p>
      </footer>
    </div>
  );
};

export default AuthBackground;
