import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import NotchHeader from '@/components/NotchHeader';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const orderToken = searchParams.get('order_token');

  useEffect(() => {
    const handlePaymentStatus = async () => {
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

      setIsLoading(false);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/wallet');
      }, 3000);
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
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          description: 'Your credits have been added to your account and are ready to use.',
          color: 'text-green-500'
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
          description: 'Please wait while we process your payment...',
          color: 'text-gaming-muted'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gaming-bg text-gaming-text">
      <NotchHeader />

      <div className="container mx-auto px-4 py-12 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gaming-card border-gaming-border">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                {getStatusIcon()}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold mb-4 ${statusInfo.color}`}
              >
                {statusInfo.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gaming-muted mb-6"
              >
                {statusInfo.description}
              </motion.p>

              {orderId && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-gaming-muted mb-6"
                >
                  Order ID: {orderId}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => navigate('/wallet')}
                  className="bg-gaming-primary hover:bg-gaming-primary/90 text-white"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Wallet
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xs text-gaming-muted mt-4"
              >
                Redirecting automatically in 3 seconds...
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentStatus; 