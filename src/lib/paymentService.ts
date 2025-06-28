import { v4 as uuidv4 } from 'uuid';

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
 * Service for handling payment integration with Cashfree payment forms
 */
export class PaymentService {
  private static instance: PaymentService;
  private paymentFormUrl: string;

  constructor() {
    // Get the payment form URL from environment variables or use a default
    this.paymentFormUrl = import.meta.env?.VITE_PAYMENT_FORM_URL || 'https://your-cashfree-payment-form-url';
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
      
      // Redirect to payment form
      window.location.href = `${this.paymentFormUrl}?${urlParams.toString()}`;
      
    } catch (error) {
      console.error('Error redirecting to payment form:', error);
      throw error;
    }
  }
}

export default PaymentService; 