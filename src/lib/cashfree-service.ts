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
 * Interface for payment order response
 */
export interface PaymentOrderResponse {
  success: boolean;
  order_token?: string;
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
  public async createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResponse> {
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
   * Redirect to Cashfree payment page
   */
  public redirectToPaymentPage(paymentLink: string): void {
    window.location.href = paymentLink;
  }

  /**
   * Initialize Cashfree Drop-in checkout
   */
  public async initializeDropIn(orderToken: string, options: any): Promise<void> {
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

      console.log('Initializing Cashfree checkout with token:', orderToken);
      
      // Get environment from import.meta if available
      const appId = import.meta.env?.VITE_CASHFREE_APP_ID || '';
      const isSandbox = appId.startsWith('TEST');
      
      console.log('Cashfree mode:', isSandbox ? 'sandbox' : 'production');
      
      // Initialize Cashfree Drop-in checkout
      const cashfree = new this.cashfreeJs({
        mode: isSandbox ? 'sandbox' : 'production'
      });

      // Function to render the drop-in checkout UI
      const renderDropIn = () => {
        console.log('Rendering Cashfree drop-in checkout...');
        cashfree.checkout({
          paymentSessionId: orderToken,
          redirectTarget: '_self',
          ...options
        });
      };

      // Render the drop-in checkout
      renderDropIn();
    } catch (error) {
      console.error('Error initializing Cashfree drop-in:', error);
      throw error;
    }
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
