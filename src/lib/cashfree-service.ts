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
      
      // Call the Netlify function to create an order
      const response = await axios.post('/.netlify/functions/create-payment-order', {
        ...params,
        orderId,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
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
        await this.loadCashfreeScript();
      }

      // Check if Cashfree.js loaded successfully
      if (!this.cashfreeJs) {
        throw new Error('Cashfree.js not loaded');
      }

      // Initialize Cashfree Drop-in checkout
      const cashfree = new this.cashfreeJs({
        mode: process.env.CASHFREE_APP_ID?.startsWith('TEST') ? 'sandbox' : 'production'
      });

      // Function to render the drop-in checkout UI
      const renderDropIn = () => {
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
