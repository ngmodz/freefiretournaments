import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Get parameters from URL
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const paymentType = searchParams.get('payment_type');
  
  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/auth', { replace: true });
      return;
    }

    const checkPaymentStatus = async () => {
      if (!orderId) {
        setLoading(false);
        setPaymentStatus('failed');
        return;
      }
      
      try {
        // First check status from URL parameters (from payment form redirect)
        if (status === 'success') {
          setPaymentStatus('success');
          setOrderDetails({ 
            orderAmount: amount,
            paymentType: paymentType || 'unknown'
          });
          setLoading(false);
          return;
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }
        
        // If status is not in URL or is pending, verify with our backend
        const response = await fetch(`/.netlify/functions/verify-payment?orderId=${orderId}`);
        const data = await response.json();
        
        if (data.status === 'PAID' || data.status === 'SUCCESS') {
          setPaymentStatus('success');
          setOrderDetails({
            orderAmount: data.amount || amount,
            paymentId: data.paymentId,
            paymentTime: data.paymentTime
          });
        } else if (data.status === 'FAILED') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
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
    };
    
    checkPaymentStatus();
  }, [orderId, status, amount, paymentType, currentUser, navigate]);
  
  const handleContinue = () => {
    // Redirect to appropriate page based on payment type
    if (paymentType === 'credit_purchase') {
      navigate('/credits'); // Navigate to credits page
    } else if (paymentType === 'wallet_topup') {
      navigate('/wallet'); // Navigate to wallet page
    } else {
      navigate('/'); // Navigate to home page
    }
  };
  
  const handleTryAgain = () => {
    // Go back to previous page
    navigate(-1);
  };
  
  // Helper function to display payment status
  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              {paymentType === 'credit_purchase' 
                ? 'Your credits have been added to your account.' 
                : 'Your payment has been processed successfully.'}
            </p>
            <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-6">
              <div className="mb-3">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
              {amount && (
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">₹{amount}</p>
                </div>
              )}
            </div>
            <Button onClick={handleContinue}>
              {paymentType === 'credit_purchase' 
                ? 'Go to Credits' 
                : paymentType === 'wallet_topup' 
                  ? 'Go to Wallet' 
                  : 'Continue'}
            </Button>
          </div>
        );
        
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              Your payment could not be processed. Please try again or contact support if the issue persists.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleTryAgain}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/')}>Go to Home</Button>
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
