
import { Trophy } from "lucide-react";

const AuthLogo = () => {
  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-gaming-primary rounded-xl flex items-center justify-center mb-4 shadow-glow transform hover:scale-105 transition-all duration-300">
        <Trophy size={32} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gaming-text">
        <span className="text-gaming-primary text-glow">Free</span>fire Tournaments
      </h1>
      <p className="text-gaming-text/70 mt-2">
        Join competitive Free Fire tournaments and win real rewards
      </p>
    </div>
  );
};

export default AuthLogo;
