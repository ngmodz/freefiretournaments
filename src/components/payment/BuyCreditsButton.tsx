import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { PaymentService } from "@/lib/paymentService";
import { useUserProfile } from "@/hooks/use-user-profile"; // Import useUserProfile

interface BuyCreditsButtonProps extends ButtonProps {
  label?: string;
  showIcon?: boolean;
  redirectTo?: string;
  directPurchase?: boolean;
  packageId?: string;
  packageName?: string;
  packageType?: 'tournament' | 'host';
  amount?: number;
  creditsAmount?: number;
}

const BuyCreditsButton: React.FC<BuyCreditsButtonProps> = ({
  label = "Buy Credits",
  showIcon = true,
  redirectTo = "/credits",
  directPurchase = false,
  packageId,
  packageName,
  packageType = 'tournament',
  amount,
  creditsAmount,
  className,
  ...props
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { user } = useUserProfile(); // Get user profile
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async () => {
    if (!directPurchase) {
      navigate(redirectTo);
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
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
      setIsProcessing(false);
      return;
    }
    
    if (!packageId || !amount || !creditsAmount) {
      console.error("Missing required props for direct purchase");
      toast({
        title: "Configuration Error",
        description: "Unable to process purchase. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const paymentService = PaymentService.getInstance();
      
      const paymentParams = {
        amount: amount,
        userId: currentUser.uid,
        userName: user?.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email || '',
        userPhone: user?.phone, // Use user's phone from profile
        paymentType: 'credit_purchase' as const,
        packageId: packageId,
        packageName: packageName || packageId,
        packageType: packageType,
        creditsAmount: creditsAmount
      };
      
      console.log(`Initiating direct payment for ${packageName || packageId}:`, paymentParams);
      
      toast({
        title: "Opening Payment Gateway",
        description: "Please complete your payment in the popup window.",
      });
      
      await paymentService.initiateCashFreeCheckout(paymentParams);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      disabled={isProcessing}
      {...props}
    >
      {isProcessing ? (
        <>
          <LoadingSpinner size="xs" className="mr-2" />
          Processing...
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
          {label}
        </>
      )}
    </Button>
  );
};

export default BuyCreditsButton; 