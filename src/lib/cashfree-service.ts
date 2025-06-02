import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for payment order parameters
 */
export interface PaymentOrderParams {
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userId: string;
  orderCurrency?: string;
  orderNote?: string;
  orderId?: string; // Optional, will generate if not provided
}

/**
 * Interface for credit payment order parameters
 */
export interface CreditPaymentOrderParams extends PaymentOrderParams {
  packageId?: string;
  packageType?: 'tournament' | 'host';
  creditsAmount?: number;
}

/**
 * Interface for payment order response
 */
export interface PaymentOrderResponse {
  success: boolean;
  order_token?: string; // Keep for backward compatibility
  payment_session_id?: string; // Latest Cashfree API uses this
  order_id?: string;
  order_status?: string;
  payment_link?: string;
  error?: string;
  details?: any;
}

/**
 * Service for handling Cashfree payment integration
 */
export class CashfreeService {
  private static instance: CashfreeService;
  private cashfreeJs: any = null;

  /**
   * Get singleton instance
   */
  public static getInstance(): CashfreeService {
    if (!CashfreeService.instance) {
      CashfreeService.instance = new CashfreeService();
    }
    return CashfreeService.instance;
  }

  /**
   * Load Cashfree.js script
   */
  public async loadCashfreeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cashfreeJs) {
        resolve();
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
          this.cashfreeJs = (window as any).Cashfree;
          resolve();
        };
        script.onerror = (error) => {
          reject(new Error('Failed to load Cashfree script'));
        };
        document.body.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a payment order via Netlify function
   */
  public async createPaymentOrder(params: PaymentOrderParams | CreditPaymentOrderParams): Promise<PaymentOrderResponse> {
    try {
      // Generate a unique order ID if not provided
      const orderId = params.orderId || `order_${Date.now()}_${uuidv4().substring(0, 8)}`;
      
      // Add debugging for params
      console.log('Creating payment order with params:', {
        ...params,
        orderId,
        customerEmail: params.customerEmail ? `${params.customerEmail.substring(0, 3)}...` : null,
        customerPhone: params.customerPhone ? `${params.customerPhone.substring(0, 3)}...` : null
      });
      
      // Call the Netlify function to create an order
      const response = await axios.post('/.netlify/functions/create-payment-order', {
        ...params,
        orderId,
      });
      
      console.log('Payment order API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      return {
        success: false,
        error: 'Failed to create payment order',
        details: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a payment order specifically for credit purchases
   */
  public async createCreditPaymentOrder(params: CreditPaymentOrderParams): Promise<PaymentOrderResponse> {
    try {
      const orderId = params.orderId || `credits_${Date.now()}_${uuidv4().substring(0, 8)}`;

      console.log('Creating credit payment order:', {
        ...params,
        orderId,
        packageType: params.packageType,
        creditsAmount: params.creditsAmount
      });

      // Call the Netlify function for credit payment order creation
      const response = await axios.post('/.netlify/functions/create-credit-payment-order', {
        ...params,
        orderId,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating credit payment order:', error);
      return {
        success: false,
        error: 'Failed to create credit payment order',
        details: error.response?.data || error.message
      };
    }
  }

  /**
   * Redirect to Cashfree payment page
   */
  public redirectToPaymentPage(paymentLink: string): void {
    window.location.href = paymentLink;
  }

  /**
   * Initialize Cashfree checkout (Updated to match latest API)
   */
  public async initializeCheckout(paymentSessionId: string, options: any = {}): Promise<void> {
    try {
      // Ensure Cashfree.js is loaded
      if (!this.cashfreeJs) {
        console.log('Loading Cashfree.js script...');
        await this.loadCashfreeScript();
      }

      // Check if Cashfree.js loaded successfully
      if (!this.cashfreeJs) {
        throw new Error('Cashfree.js not loaded');
      }

      console.log('Initializing Cashfree checkout with payment session ID:', paymentSessionId);

      // Get environment from import.meta if available
      const appId = import.meta.env?.VITE_CASHFREE_APP_ID || '';
      const isSandbox = appId.startsWith('TEST');

      console.log('Cashfree mode:', isSandbox ? 'sandbox' : 'production');

      // Initialize Cashfree according to latest documentation
      const cashfree = new this.cashfreeJs({
        mode: isSandbox ? 'sandbox' : 'production'
      });

      // Default checkout options
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self', // Open in same tab
        ...options
      };

      console.log('Opening Cashfree checkout with options:', checkoutOptions);

      // Open checkout using latest API
      cashfree.checkout(checkoutOptions);

    } catch (error) {
      console.error('Error initializing Cashfree checkout:', error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async initializeDropIn(orderToken: string, options: any): Promise<void> {
    console.warn('initializeDropIn is deprecated, use initializeCheckout instead');
    return this.initializeCheckout(orderToken, options);
  }

  /**
   * Get payment status for an order
   */
  public async getPaymentStatus(orderId: string): Promise<any> {
    try {
      // Call the Firebase function (not implemented yet, would need to create this)
      const response = await axios.get(`/.netlify/functions/check-payment-status?orderId=${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}
