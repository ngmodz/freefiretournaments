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
  userPhone?: string; // Add user phone number
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

  constructor() {
    // Get the payment form URL from environment variables
    this.paymentFormUrl = import.meta.env?.VITE_PAYMENT_FORM_URL || '';
    
    // Get the API base URL (Vercel functions)
    this.apiBaseUrl = import.meta.env?.VITE_API_URL || '';
    
    // If no API URL is set, use the current origin for Vercel
    if (!this.apiBaseUrl) {
      this.apiBaseUrl = `${window.location.origin}/api`;
    }
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
        userPhone: params.userPhone || '9999999999', // Use provided phone or fallback
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
      if (!orderResponse.payment_session_id) {
        console.error('Payment session ID missing in order response:', orderResponse);
        throw new Error('Payment session ID not received from the API. Please check server logs.');
      }
      
      console.log('Initiating checkout with session ID:', orderResponse.payment_session_id);

      // Initialize popup checkout
      await CashFreeService.openCheckout(
        orderResponse.payment_session_id,
        (data) => {
          console.log('Payment successful:', data);
          // CRITICAL: Don't redirect to success immediately - let webhook handle credit addition
          // Just redirect to a status page that will poll for completion
          window.location.href = `/payment-status?orderId=${data.orderId}&status=processing&message=Payment completed, processing credits...`;
        },
        (data) => {
          console.log('Payment failed:', data);
          // For failures, redirect to failure page immediately
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