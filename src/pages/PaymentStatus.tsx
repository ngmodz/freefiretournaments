import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import NotchHeader from '@/components/NotchHeader';
import { PaymentService } from '@/lib/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/hooks/useCreditBalance';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { tournamentCredits, hostCredits, isLoading: creditsLoading } = useCreditBalance(currentUser?.uid);

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId') || searchParams.get('order_id');
  const orderToken = searchParams.get('order_token');
  const packageType = searchParams.get('packageType');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const handlePaymentStatus = async () => {
      try {
        // If we have an order ID, verify the payment status
        if (orderId) {
          const paymentService = PaymentService.getInstance();
          const verificationResult = await paymentService.verifyPayment(orderId);
          
          if (verificationResult.verified) {
            toast({
              title: "Payment Successful!",
              description: "Your credits have been added to your account.",
            });
          } else if (verificationResult.error) {
            toast({
              title: "Payment Failed",
              description: verificationResult.error || "Your payment could not be processed. Please try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: status === 'cancelled' ? "Payment Cancelled" : "Payment Status",
              description: status === 'cancelled' 
                ? "You cancelled the payment process." 
                : "Payment status is being verified.",
              variant: status === 'cancelled' ? "destructive" : "default"
            });
          }
        } else {
          // Fallback to URL status parameter if no order ID
          if (status === 'success') {
            toast({
              title: "Payment Successful!",
              description: "Your credits have been added to your account.",
            });
          } else if (status === 'failed') {
            toast({
              title: "Payment Failed",
              description: "Your payment could not be processed. Please try again.",
              variant: "destructive"
            });
          } else if (status === 'cancelled') {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error processing payment status:', error);
        toast({
          title: "Error",
          description: "There was a problem verifying your payment.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);

        // Redirect based on payment status
        setTimeout(() => {
          if (status === 'success') {
            navigate('/wallet'); // Success -> go to wallet to see credits
          } else {
            navigate('/'); // Failed/cancelled -> go to home
          }
        }, 3000);
      }
    };

    handlePaymentStatus();
  }, [status, orderId, orderToken, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-yellow-500" />;
      default:
        return <Clock className="h-16 w-16 text-gaming-muted" />;
    }
  };

  const getStatusMessage = () => {
    const packageDisplay = packageType === 'host' ? 'Host Credits' : 'Tournament Credits';
    const creditBalance = packageType === 'host' ? hostCredits : tournamentCredits;
    
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          description: `Your ${packageDisplay} have been added to your account and are ready to use.`,
          color: 'text-green-500',
          extraInfo: !creditsLoading ? (
            <div className="text-green-600 font-medium mt-2">
              Current {packageDisplay} Balance: {creditBalance}
            </div>
          ) : null
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again.',
          color: 'text-red-500'
        };
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          description: 'You cancelled the payment process. No charges were made.',
          color: 'text-yellow-500'
        };
      default:
        return {
          title: 'Processing Payment',
          description: 'Please wait while we verify your payment...',
          color: 'text-gaming-muted'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen flex flex-col">
      <NotchHeader />
      
      {/* Custom header with title and back button */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-40">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <Home className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Payment Status</h1>
        </div>
      </div>

      <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Clock className="h-12 w-12 text-gaming-muted" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Verifying Payment</h3>
              <p className="text-muted-foreground text-center">
                Please wait while we verify your payment status...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              {getStatusIcon()}
              <h3 className={`text-xl font-semibold mt-4 mb-2 ${statusInfo.color}`}>
                {statusInfo.title}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {statusInfo.description}
              </p>
              
              {orderId && (
                <div className="w-full bg-muted/50 p-3 rounded-md text-sm mb-4">
                  <p><span className="text-muted-foreground">Order ID:</span> {orderId}</p>
                  {amount && <p><span className="text-muted-foreground">Amount:</span> ₹{amount}</p>}
                  {statusInfo.extraInfo}
                </div>
              )}

              <div className="flex flex-col w-full gap-2 mt-2">
                <Button onClick={() => navigate('/wallet')}>
                  Go to Wallet
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus; 