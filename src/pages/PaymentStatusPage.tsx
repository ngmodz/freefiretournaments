import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentService } from '@/lib/paymentService';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { toast } from '@/components/ui/use-toast';

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  // Use useCreditBalance hook to access user's credit balance
  const { tournamentCredits, hostCredits, isLoading: creditsLoading } = useCreditBalance(currentUser?.uid);

  // Get parameters from URL
  const orderId = searchParams.get('orderId') || searchParams.get('order_id');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const paymentType = searchParams.get('payment_type');
  const paymentId = searchParams.get('payment_id');
  const packageType = searchParams.get('packageType');
  
  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/auth', { replace: true });
      return;
    }

    let verificationInterval: number;
    
    const checkPaymentStatus = async () => {
      if (!orderId) {
        setLoading(false);
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: "Could not verify payment: Missing order ID.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // First check status from URL parameters (from payment form redirect)
        if (status === 'success') {
          setPaymentStatus('success');
          setOrderDetails({ 
            orderAmount: amount,
            paymentType: paymentType || 'unknown',
            packageType: packageType || 'tournament'
          });
          
          toast({
            title: "Payment Successful",
            description: "Your payment was successful and credits are being added to your account.",
            variant: "default"
          });
          
          setVerificationAttempted(true);
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          setLoading(false);
          
          toast({
            title: "Payment Failed",
            description: "Your payment was not successful. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        // If status is not in URL or is pending, verify with our backend
        const paymentService = PaymentService.getInstance();
        const verificationResult = await paymentService.verifyPayment(orderId, paymentId || undefined);
        
        if (verificationResult.verified) {
          setPaymentStatus('success');
          setOrderDetails({
            orderAmount: verificationResult.amount || amount,
            paymentId: verificationResult.paymentId,
            orderId: verificationResult.orderId,
            packageType: packageType || 'tournament'
          });
          
          toast({
            title: "Payment Verified",
            description: "Your payment has been verified and credits added to your account.",
          });
        } else if (verificationResult.error) {
          setPaymentStatus('failed');
          
          toast({
            title: "Payment Failed",
            description: verificationResult.error || "There was a problem verifying your payment.",
            variant: "destructive"
          });
        } else {
          setPaymentStatus('pending');
          
          // If payment is still pending and we haven't verified 3 times yet,
          // set up an interval to check again
          if (!verificationAttempted) {
            setVerificationAttempted(true);
            let attempts = 0;
            
            verificationInterval = window.setInterval(async () => {
              attempts++;
              console.log(`Verification attempt ${attempts}...`);
              
              try {
                const retryResult = await paymentService.verifyPayment(orderId, paymentId || undefined);
                
                if (retryResult.verified) {
                  clearInterval(verificationInterval);
                  setPaymentStatus('success');
                  setOrderDetails({
                    orderAmount: retryResult.amount || amount,
                    paymentId: retryResult.paymentId,
                    orderId: retryResult.orderId,
                    packageType: packageType || 'tournament'
                  });
                  
                  toast({
                    title: "Payment Verified",
                    description: "Your payment has been verified and credits added to your account.",
                  });
                } else if (attempts >= 3) {
                  clearInterval(verificationInterval);
                }
              } catch (error) {
                console.error('Error in verification retry:', error);
                if (attempts >= 3) {
                  clearInterval(verificationInterval);
                }
              }
            }, 5000); // Check every 5 seconds
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // If there's an error, we still show status from URL parameter if available
        if (status === 'success') {
          setPaymentStatus('success');
        } else if (status === 'failed') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }
      } finally {
        setLoading(false);
      }
    }
    
    checkPaymentStatus();
    
    // Cleanup the interval when component unmounts
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [orderId, status, amount, paymentType, paymentId, currentUser, navigate, packageType]);
  
  const handleContinue = () => {
    // Redirect to appropriate page based on payment type or package type
    if (paymentType === 'credit_purchase' || packageType === 'tournament' || packageType === 'host') {
      navigate('/credits');
    } else if (paymentType === 'wallet_topup') {
      navigate('/wallet');
    } else {
      navigate('/');
    }
  };
  
  const handleTryAgain = () => {
    // Go back to previous page
    navigate('/credits');
  };
  
  // Helper function to display payment status
  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'success':
        const packageDisplay = orderDetails?.packageType === 'host' ? 'Host Credits' : 'Tournament Credits';
        const creditBalance = orderDetails?.packageType === 'host' ? hostCredits : tournamentCredits;
        
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              {paymentType === 'credit_purchase' || orderDetails?.packageType
                ? `Your ${packageDisplay} have been added to your account.` 
                : 'Your payment has been processed successfully.'}
            </p>
            <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-4">
              <div className="mb-3">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
              {orderDetails?.orderAmount && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">₹{orderDetails.orderAmount}</p>
                </div>
              )}
              {!creditsLoading && (
                <div>
                  <p className="text-sm text-gray-500">Current {packageDisplay} Balance</p>
                  <p className="font-medium text-green-600">{creditBalance}</p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleContinue}
              className="mb-4"
            >
              Continue
            </Button>
          </div>
        );
        
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              Your payment was not successful. Please try again or contact support if the problem persists.
            </p>
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-6">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleTryAgain}
                variant="default"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        );
        
      case 'pending':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-yellow-100 p-4 rounded-full mb-4">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Processing</h2>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. Please do not close this page.
              This may take a few moments to complete.
            </p>
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-4">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              You will be automatically redirected once the payment is confirmed.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Verifying payment status...</p>
          </div>
        ) : (
          getStatusDisplay()
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
