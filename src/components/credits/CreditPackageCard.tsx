import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PaymentService } from "@/lib/paymentService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "../ui/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile"; // Import useUserProfile
import { useNavigate } from "react-router-dom";

export interface CreditPackageProps {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPopular?: boolean;
  isSpecialOffer?: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  onPurchase: () => void;
  isProcessing?: boolean;
  description: string;
  packageType: 'tournament' | 'host';
}

const CreditPackageCard: React.FC<CreditPackageProps> = ({
  id,
  name,
  credits,
  price,
  originalPrice,
  discountPercentage,
  isPopular,
  isSpecialOffer,
  features,
  icon,
  gradient,
  onPurchase,
  isProcessing,
  description,
  packageType
}) => {
  const { currentUser } = useAuth();
  const { user } = useUserProfile(); // Get user profile
  const navigate = useNavigate();

  const handlePurchase = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to purchase credits",
        variant: "destructive"
      });
      return;
    }

    // Check for phone number
    if (!user?.phone) {
      toast({
        title: "Phone Number Required",
        description: "Please add a phone number to your profile before making a purchase.",
        variant: "destructive",
        action: (
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Go to Settings
          </button>
        ),
      });
      return;
    }

    try {
      const paymentService = PaymentService.getInstance();
      
      await paymentService.initiateCashFreeCheckout({
        amount: price,
        userId: currentUser.uid,
        userName: user?.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email || '',
        userPhone: user?.phone, // Use user's phone from profile
        paymentType: 'credit_purchase',
        packageId: id,
        packageName: name,
        packageType: packageType,
        creditsAmount: credits
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an error initiating the payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className={cn(
        "h-full flex flex-col bg-gradient-to-b border-gaming-border/50 overflow-hidden relative",
        gradient,
        isPopular && "ring-2 ring-gaming-accent shadow-lg shadow-gaming-accent/20"
      )}>
        {isPopular && (
          <div className="absolute top-0 right-0">
            <div className="bg-gaming-accent text-white text-xs font-bold py-1 px-3 rounded-bl-md shadow-md">
              MOST POPULAR
            </div>
          </div>
        )}
        <CardContent className="p-6 flex-grow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-gaming-bg/30">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-sm text-gaming-muted">
                {credits} Credits
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">₹{price}</span>
              {originalPrice && (
                <span className="text-sm text-gaming-muted line-through mb-1">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            {discountPercentage && (
              <span className="text-xs text-green-500 font-medium">
                Save {discountPercentage}%
              </span>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-2 mb-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gaming-muted">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handlePurchase}
            disabled={isProcessing}
            className={cn(
              "w-full",
              isPopular 
                ? "bg-gaming-accent hover:bg-gaming-accent/90" 
                : "bg-gaming-primary hover:bg-gaming-primary/90"
            )}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="xs" />
                Processing...
              </div>
            ) : (
              "Purchase"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default CreditPackageCard; 