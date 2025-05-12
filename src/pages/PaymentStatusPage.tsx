import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CashfreeService } from '../lib/cashfree-service';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        // If status is directly provided by return URL, use it
        if (status === 'success') {
          setPaymentStatus('success');
        } else if (status === 'failed') {
          setPaymentStatus('failed');
        } else {
          // Otherwise fetch payment status from backend
          const cashfreeService = CashfreeService.getInstance();
          const response = await cashfreeService.getPaymentStatus(orderId);
          
          if (response.success) {
            setOrderDetails(response.orderDetails);
            
            if (response.orderDetails?.orderStatus === 'PAID') {
              setPaymentStatus('success');
            } else if (['ACTIVE', 'PENDING'].includes(response.orderDetails?.orderStatus)) {
              setPaymentStatus('pending');
            } else {
              setPaymentStatus('failed');
            }
          } else {
            setPaymentStatus('pending'); // Default to pending if can't determine
          }
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
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
    
    fetchPaymentStatus();
  }, [orderId, status]);
  
  const handleContinue = () => {
    // Redirect to appropriate page based on payment status
    if (paymentStatus === 'success') {
      navigate('/tournaments'); // Navigate to tournaments page
    } else {
      navigate('/'); // Navigate to home page
    }
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
              Your payment for {orderDetails?.orderAmount ? `₹${orderDetails.orderAmount}` : 'the tournament'} has been processed successfully.
            </p>
            <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-6">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">{orderId}</p>
            </div>
            <Button onClick={handleContinue}>Continue to Tournaments</Button>
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
              <Button variant="outline" onClick={() => navigate(-1)}>Try Again</Button>
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
            <div className="bg-gray-50 p-4 rounded-md w-full max-w-sm mb-4">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">{orderId}</p>
            </div>
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
