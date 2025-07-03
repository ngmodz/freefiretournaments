import { v4 as uuidv4 } from 'uuid';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CashFreeService } from './cashfreeService';

/**
 * Interface for payment form parameters
 */
export interface PaymentFormParams {
  amount: number;
  userId: string;
  userName: string;
  userEmail: string;
  paymentType: 'wallet_topup' | 'credit_purchase';
  orderId?: string;
  packageId?: string;
  packageName?: string;
  packageType?: 'tournament' | 'host';
  creditsAmount?: number;
}

/**
 * Interface for payment verification response
 */
export interface PaymentVerificationResponse {
  success: boolean;
  verified: boolean;
  orderId: string;
  amount?: number;
  paymentId?: string;
  error?: string;
  message?: string;
  testPayment?: boolean;
}

/**
 * Service for handling payment integration
 */
export class PaymentService {
  private static instance: PaymentService;
  private paymentFormUrl: string;
  private apiBaseUrl: string;
  private isTestEnvironment: boolean;

  constructor() {
    // Get the payment form URL from environment variables
    this.paymentFormUrl = import.meta.env?.VITE_PAYMENT_FORM_URL || '';
    
    // Get the API base URL (Vercel functions)
    this.apiBaseUrl = import.meta.env?.VITE_API_URL || '';
    
    // If no API URL is set, use the current origin for Vercel
    if (!this.apiBaseUrl) {
      this.apiBaseUrl = `${window.location.origin}/api`;
    }

    // Check if we're in test environment
    this.isTestEnvironment = import.meta.env?.VITE_CASHFREE_ENVIRONMENT === 'SANDBOX' || 
                            import.meta.env?.MODE === 'development';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Generate a unique order ID
   */
  public generateOrderId(prefix: string = 'order'): string {
    return `${prefix}_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Redirect to payment form for wallet top-up
   */
  public redirectToPaymentForm(params: PaymentFormParams): void {
    try {
      // Generate order ID if not provided
      const orderId = params.orderId || this.generateOrderId(params.paymentType === 'wallet_topup' ? 'wallet' : 'credits');
      
      // Create URL parameters for the payment form
      const urlParams = new URLSearchParams({
        amount: params.amount.toString(),
        user_id: params.userId,
        user_name: params.userName,
        user_email: params.userEmail || '',
        order_id: orderId,
        payment_type: params.paymentType,
        return_url: `${window.location.origin}/payment-status`
      });
      
      // Add additional parameters for credit purchases
      if (params.paymentType === 'credit_purchase' && params.packageId && params.packageType && params.creditsAmount) {
        urlParams.append('package_id', params.packageId);
        urlParams.append('package_name', params.packageName || params.packageId);
        urlParams.append('package_type', params.packageType);
        urlParams.append('credits_amount', params.creditsAmount.toString());
      }
      
      // Log the payment initiation
      console.log(`Initiating payment:`, Object.fromEntries(urlParams.entries()));
      
      // For development/testing, simulate a successful payment
      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.log('DEV MODE: Simulating payment redirect');
        
        // Simulate redirect to payment status page
        setTimeout(() => {
          window.location.href = `/payment-status?order_id=${orderId}&status=success&amount=${params.amount}`;
        }, 1500);
        
        return;
      }
      
      // Determine which payment form URL to use
      let paymentFormUrl = this.paymentFormUrl;
      
      // Use the configured payment form URL
      if (!paymentFormUrl) {
        throw new Error('Payment form URL not configured');
      }
      
      // Redirect to payment form
      window.location.href = `${paymentFormUrl}?${urlParams.toString()}`;
      
    } catch (error) {
      console.error('Error redirecting to payment form:', error);
      throw error;
    }
  }
  
  /**
   * Verify a payment using the server-side verification function
   * @param orderId The order ID to verify
   * @param paymentId Optional payment ID from payment provider
   * @param skipCreditUpdate Whether to skip credit update (default: false)
   */
  public async verifyPayment(orderId: string, paymentId?: string, skipCreditUpdate = false): Promise<PaymentVerificationResponse> {
    try {
      console.log(`Verifying payment for order ${orderId}`);
      
      // Prepare the request
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiUrl}/verify-payment`;
      
      // Add query parameters if using GET
      const params: Record<string, string> = {};
      if (paymentId) {
        params.paymentId = paymentId;
      }
      
      // For development/testing, simulate a successful verification
      if (import.meta.env.DEV && import.meta.env.VITE_MOCK_PAYMENTS === 'true') {
        console.log('DEV MODE: Simulating payment verification');
        
        // Return a mock successful response
        return {
          success: true,
          verified: true,
          orderId: orderId,
          amount: 100, // Mock amount
          paymentId: paymentId || `mock_payment_${Date.now()}`,
          message: 'Payment verified successfully (DEV MODE)'
        };
      }
      
      // Make the API call to verify payment - use POST to avoid URL length limitations
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          skipCreditUpdate
        })
      });
      
      // If response is not OK, throw error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
      
      // Log the verification response
      console.log('Payment verification response:', data);
            
      // Return the verification result
      return {
        success: data.success || false,
        verified: data.verified || false,
        orderId: data.orderId || orderId,
        amount: data.amount || data.orderAmount,
        paymentId: data.paymentId || paymentId,
        error: data.error,
        message: data.message || (data.verified ? 'Payment verified' : 'Payment not completed'),
        testPayment: false
      };
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      
      // Return error response
      return {
        success: false,
        verified: false,
        orderId: orderId,
        error: error.message || 'An error occurred while verifying the payment',
        message: 'Payment verification failed',
        testPayment: false
      };
    }
  }

  /**
   * Force verify a payment in test environment
   * This is useful for testing the payment flow without actually making a payment
   * @param orderId The order ID to verify
   * @param userId The user ID who made the payment
   * @param amount The payment amount
   * @param packageType The package type (tournament or host)
   * @param creditsAmount The actual number of credits to add
   */
  public async forceVerifyTestPayment(
    orderId: string,
    userId: string,
    amount: number,
    packageType: 'tournament' | 'host' = 'tournament',
    creditsAmount?: number
  ): Promise<PaymentVerificationResponse> {
    try {
      // Only allow in test environment
      if (!this.isTestEnvironment) {
        throw new Error('Force verification is only allowed in test environment');
      }

      console.log(`Force verifying test payment for order ${orderId}`);
      
      // Prepare the request
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiUrl}/verify-payment`;
      
      // Make the API call to verify payment with forceVerify flag
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          userId,
          amount,
          packageType,
          skipCreditUpdate: false,
          forceVerify: true,
          testOrderData: {
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            order_status: 'PAID',
            order_tags: {
              userId,
              packageType,
              creditsAmount: creditsAmount ? creditsAmount.toString() : amount.toString()
            }
          }
        })
      });
      
      // If response is not OK, throw error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
      
      // Log the verification response
      console.log('Force verification response:', data);
            
      // Return the verification result
      return {
        success: data.success || false,
        verified: data.verified || false,
        orderId: data.orderId || orderId,
        amount: data.amount || data.orderAmount,
        paymentId: data.paymentId || `test_${Date.now()}`,
        error: data.error,
        message: data.message || (data.verified ? 'Test payment verified successfully' : 'Test payment verification failed'),
        testPayment: true
      };
      
    } catch (error) {
      console.error('Error force verifying test payment:', error);
      
      // Return error response
      return {
        success: false,
        verified: false,
        orderId: orderId,
        error: error.message || 'An error occurred while force verifying the test payment',
        message: 'Test payment verification failed',
        testPayment: false
      };
    }
  }

  /**
   * Initialize CashFree popup checkout for credit purchase
   */
  public async initiateCashFreeCheckout(params: PaymentFormParams): Promise<void> {
    try {
      // Prepare CashFree order data using the correct interface
      const orderData = {
        amount: params.amount,
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        userPhone: '9999999999', // You might want to collect this from user
        packageId: params.packageId || '',
        packageName: params.packageName || '',
        packageType: params.packageType || 'tournament' as 'tournament' | 'host',
        creditsAmount: params.creditsAmount
      };

      console.log('Creating CashFree order:', orderData);

      // Create order via CashFree service
      const orderResponse = await CashFreeService.createOrder(orderData);
      
      console.log('CashFree order created with response:', orderResponse);
      
      // Validate the response
      if (!orderResponse) {
        throw new Error('No response received from the order creation API');
      }

      // Check if payment session ID exists
      if (!orderResponse.paymentSessionId) {
        console.error('Payment session ID missing in order response:', orderResponse);
        throw new Error('Payment session ID not received from the API. Please check server logs.');
      }
      
      console.log('Initiating checkout with session ID:', orderResponse.paymentSessionId);

      // Initialize popup checkout
      await CashFreeService.openCheckout(
        orderResponse.paymentSessionId,
        (data) => {
          console.log('Payment successful:', data);
          // Redirect to success page
          window.location.href = `/payment-status?status=success&orderId=${data.orderId}`;
        },
        (data) => {
          console.log('Payment failed:', data);
          // Redirect to failure page
          window.location.href = `/payment-status?status=failed&orderId=${data.orderId}&message=${encodeURIComponent(data.txMsg)}`;
        }
      );
      
    } catch (error) {
      console.error('CashFree checkout error:', error);
      throw error;
    }
  }
}

export default PaymentService;