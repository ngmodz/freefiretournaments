import React, { useState } from 'react';
import { CashfreeService, PaymentOrderParams, PaymentOrderResponse } from '../../lib/cashfree-service';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from '../ui/use-toast';

interface CashfreeCheckoutProps {
  amount: number;
  orderId?: string;
  orderNote?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess?: (response: PaymentOrderResponse) => void;
  onError?: (error: any) => void;
}

export const CashfreeCheckout: React.FC<CashfreeCheckoutProps> = ({
  amount,
  orderId,
  orderNote = 'Tournament Registration',
  customerInfo,
  onSuccess,
  onError,
}) => {
  const [name, setName] = useState(customerInfo?.name || '');
  const [email, setEmail] = useState(customerInfo?.email || '');
  const [phone, setPhone] = useState(customerInfo?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Cashfree service instance
  const cashfreeService = CashfreeService.getInstance();

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Valid email is required');
      return false;
    }
    
    if (!phone.trim() || !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setError('Valid 10-digit phone number is required');
      return false;
    }
    
    return true;
  };

  /**
   * Handle payment initiation
   */
  const handlePayment = async () => {
    // Reset error state
    setError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Set loading state
    setLoading(true);
    
    try {
      // Prepare payment order parameters
      const params: PaymentOrderParams = {
        orderAmount: amount,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        orderNote,
        orderId,
      };
      
      // Create payment order
      const response = await cashfreeService.createPaymentOrder(params);
      
      if (!response.success || !response.payment_link) {
        throw new Error(response.error || 'Failed to create payment order');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
      
      toast({
        title: 'Payment Initiated',
        description: 'Redirecting to payment gateway...',
      });
      
      // Redirect to Cashfree payment page
cashfreeService.redirectToPaymentPage(response.payment_link);
    } catch (error) {
      // Handle errors
      console.error('Payment initiation error:', error);
      
      setError(error.message || 'Failed to initiate payment');
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment Details</h2>
      
      <div className="space-y-4">
        {/* Amount Display */}
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">Payment Amount</p>
          <p className="text-2xl font-bold">₹{amount.toFixed(2)}</p>
        </div>
        
        {/* Customer Details Form */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              disabled={loading}
              required
            />
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Payment Button */}
        <Button
          className="w-full"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ₹{amount.toFixed(2)}</>
          )}
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          Secured by Cashfree Payments
        </p>
      </div>
    </div>
  );
};
