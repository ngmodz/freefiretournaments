import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trophy, Users, Clock, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const CreditBenefits: React.FC = () => {
  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Instant Access",
      description: "Join tournaments immediately after purchase"
    },
    {
      icon: <Trophy className="h-6 w-6 text-gaming-accent" />,
      title: "Exclusive Tournaments",
      description: "Access premium tournaments with higher rewards"
    },
    {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: "Host Your Own",
      description: "Create and manage your own gaming events"
    },
    {
      icon: <Clock className="h-6 w-6 text-green-500" />,
      title: "No Expiry",
      description: "Credits never expire, use them anytime"
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-500" />,
      title: "Secure Transactions",
      description: "Safe payment processing with encryption"
    },
    {
      icon: <Sparkles className="h-6 w-6 text-pink-500" />,
      title: "Special Offers",
      description: "Regular discounts and bonus credits"
    }
  ];

  return (
    <div className="py-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6 text-center"
      >
        Why Purchase Credits?
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-gaming-card/50 border-gaming-border/50 h-full">
              <CardContent className="p-5">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-gaming-bg/50 rounded-lg">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gaming-text mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gaming-muted">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CreditBenefits; 