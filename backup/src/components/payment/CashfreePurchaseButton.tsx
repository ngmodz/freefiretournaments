import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { CashfreeService } from "@/lib/cashfree-service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface CashfreePurchaseButtonProps extends ButtonProps {
  amount: number;
  productName: string;
  label?: string;
  showIcon?: boolean;
  additionalParams?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
}

const CashfreePurchaseButton: React.FC<CashfreePurchaseButtonProps> = ({
  amount,
  productName,
  label = "Buy Now",
  showIcon = true,
  additionalParams = {},
  onSuccess,
  onFailure,
  className,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { currentUser } = useAuth();
  
  const handlePayment = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make payments",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get Cashfree service instance
      const cashfreeService = CashfreeService.getInstance();
      
      // Get user information
      const customerName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      const customerEmail = currentUser.email || 'user@example.com';
      const customerPhone = currentUser.phoneNumber || '9999999999';
      
      // Create payment parameters
      const paymentParams = {
        orderAmount: amount,
        customerName,
        customerEmail,
        customerPhone,
        userId: currentUser.uid,
        orderNote: `${productName} - ${new Date().toISOString()}`,
        ...additionalParams
      };
      
      // Create payment order
      const response = await cashfreeService.createPaymentOrder(paymentParams);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create payment order');
      }
      
      // Use payment_session_id if available, fallback to order_token
      const sessionId = response.payment_session_id || response.order_token;
      
      if (!sessionId) {
        throw new Error('No payment session ID or order token received');
      }
      
      // Initialize Cashfree checkout
      await cashfreeService.initializeCheckout(sessionId, {
        onSuccess: (data: any) => {
          console.log('Payment successful:', data);
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully",
          });
          
          if (onSuccess) onSuccess(data);
        },
        onFailure: (data: any) => {
          console.log('Payment failed:', data);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive"
          });
          
          if (onFailure) onFailure(data);
        }
      });
      
    } catch (error) {
      console.error('Payment error:', error);
      
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment",
        variant: "destructive"
      });
      
      if (onFailure) onFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className={className}
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

export default CashfreePurchaseButton; 