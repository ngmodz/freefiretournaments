import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { PaymentService } from "@/lib/paymentService";

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
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email || '',
        paymentType: 'credit_purchase',
        packageId: packageId,
        packageName: packageName || packageId,
        packageType: packageType,
        creditsAmount: creditsAmount
      };
      
      console.log(`Initiating direct payment for ${packageName || packageId}:`, paymentParams);
      
      toast({
        title: "Redirecting to Payment",
        description: "You will be redirected to the payment page.",
      });
      
      paymentService.redirectToPaymentForm(paymentParams);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive"
      });
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
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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