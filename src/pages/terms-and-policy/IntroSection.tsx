import React from "react";
import { motion } from "framer-motion";

const IntroSection = () => {
  return (
    <div className="mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gaming-card p-6 rounded-lg shadow-md border border-gaming-border/30"
      >
        <h1 className="text-3xl font-bold text-gaming-primary mb-3">Terms and Policy for Freefire Tournaments</h1>
        <p className="text-sm text-gaming-text/70 mb-6">Last Updated: May 1, 2025</p>
        
        <div className="p-4 bg-gaming-card/50 border border-gaming-border/10 rounded-md mb-6">
          <p className="text-gaming-text/90">
            Welcome to <strong className="text-gaming-primary">Freefire Tournaments</strong>, a Progressive Web App (PWA) designed to host and manage Free Fire tournaments. By accessing or using our platform, you agree to be bound by these Terms and Policy ("Terms"). If you do not agree, please do not use the app. These Terms govern your use of the app, including features such as tournament creation, participation, payments, and user interactions.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default IntroSection; 