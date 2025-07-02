import { load } from '@cashfreepayments/cashfree-js';

// CashFree Configuration
export const cashfreeConfig = {
  appId: import.meta.env.VITE_CASHFREE_APP_ID,
  environment: import.meta.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX',
  apiVersion: import.meta.env.VITE_CASHFREE_API_VERSION || '2025-01-01',
  baseUrl: import.meta.env.VITE_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
    ? import.meta.env.VITE_CASHFREE_PRODUCTION_URL 
    : import.meta.env.VITE_CASHFREE_SANDBOX_URL,
  returnUrl: import.meta.env.VITE_RETURN_URL || 'http://localhost:5173/payment-status'
};

export interface CashFreeOrderRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  orderMeta: {
    returnUrl: string;
    notifyUrl?: string;
  };
  orderNote?: string;
  orderTags?: Record<string, string>;
}

export interface CashFreeOrderResponse {
  cfOrderId: string;
  orderId: string;
  orderStatus: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  orderExpiryTime: string;
  createdAt: string;
  orderMeta: {
    returnUrl: string;
    notifyUrl?: string;
  };
}

export interface PaymentCallbackData {
  orderStatus: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TERMINATED';
  orderId: string;
  cfOrderId: string;
  txStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';
  txMsg: string;
  paymentSessionId: string;
  txTime: string;
  referenceId: string;
  paymentDetails?: {
    paymentAmount: number;
    paymentMethod: string;
    paymentGateway: string;
    paymentTime: string;
  };
}

export class CashFreeService {
  private static cashfree: any = null;
  private static initialized = false;

  /**
   * Initialize CashFree SDK
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing CashFree SDK...');
      
      // Validate configuration
      if (!cashfreeConfig.appId) {
        throw new Error('CashFree App ID is required. Please check your environment variables.');
      }

      // Load CashFree SDK
      this.cashfree = await load({
        mode: cashfreeConfig.environment.toLowerCase() as 'sandbox' | 'production'
      });

      this.initialized = true;
      console.log('✅ CashFree SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CashFree SDK:', error);
      throw new Error('Failed to initialize payment gateway. Please try again.');
    }
  }
  /**
   * Create payment order on backend
   */
  static async createOrder(orderData: {
    amount: number;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    packageId?: string;
    packageName?: string;
    packageType: 'tournament' | 'host';
  }): Promise<CashFreeOrderResponse> {
    try {
      console.log('📝 Creating payment order:', orderData);

      // Generate shorter order ID to meet CashFree's 50 character limit
      const shortUserId = orderData.userId.substring(0, 8); // First 8 chars of userId
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const orderId = `${orderData.packageType.substring(0, 4)}_${shortUserId}_${timestamp}`;
      
      // Always use the real Cashfree API endpoint
      const endpoint = '/api/create-payment-order';
      
      console.log('🔍 Debug - Using real Cashfree API endpoint:', endpoint);
      
      // Send data in the format expected by the API
      const requestData = {
        amount: orderData.amount,
        userId: orderData.userId,
        userName: orderData.userName,
        userEmail: orderData.userEmail,
        userPhone: orderData.userPhone,
        packageId: orderData.packageId || '',
        packageName: orderData.packageName || '',
        packageType: orderData.packageType
      };

      console.log(`📡 Calling ${endpoint} for real Cashfree payment`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const orderResponse: { success: boolean, data: CashFreeOrderResponse } = await response.json();
      console.log('✅ Payment order created:', orderResponse);

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order.');
      }

      return orderResponse.data;
    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Open CashFree checkout popup
   */
  static async openCheckout(
    paymentSessionId: string,
    onSuccess?: (data: PaymentCallbackData) => void,
    onFailure?: (data: PaymentCallbackData) => void,
    onCancel?: () => void
  ): Promise<void> {
    try {
      console.log('🔓 Opening checkout with payment session ID:', paymentSessionId);
      
      if (!paymentSessionId) {
        throw new Error('Payment session ID is missing or undefined');
      }

      // Initialize the Cashfree SDK
      await this.initialize();

      if (!this.cashfree) {
        throw new Error('CashFree SDK not initialized');
      }

      console.log('🚀 Opening CashFree checkout popup with session ID:', paymentSessionId);

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal'
      };

      console.log('Checkout options:', checkoutOptions);

      // Open the checkout popup
      this.cashfree
        .checkout(checkoutOptions)
        .then((result: any) => {
          console.log('CashFree checkout result:', result);
          
          // Handle payment result based on status
          if (result.status === 'OK' || result.status === 'SUCCESS') {
            console.log('Payment successful:', result);
            
            // Format callback data
            const callbackData: PaymentCallbackData = {
              orderStatus: result.order?.status || 'PAID',
              orderId: result.order?.id || '',
              cfOrderId: result.order?.cfOrderId || '',
              txStatus: 'SUCCESS',
              txMsg: 'Payment successful',
              paymentSessionId,
              txTime: result.transaction?.txTime || new Date().toISOString(),
              referenceId: result.transaction?.referenceId || ''
            };
            
            // Call success callback
            onSuccess?.(callbackData);
          } else {
            console.log('Payment failed or cancelled:', result);
            
            // Format callback data
            const callbackData: PaymentCallbackData = {
              orderStatus: result.order?.status || 'CANCELLED',
              orderId: result.order?.id || '',
              cfOrderId: result.order?.cfOrderId || '',
              txStatus: result.transaction?.txStatus || 'FAILED',
              txMsg: result.transaction?.txMsg || 'Payment failed',
              paymentSessionId,
              txTime: result.transaction?.txTime || new Date().toISOString(),
              referenceId: result.transaction?.referenceId || ''
            };
            
            // Call failure callback
            onFailure?.(callbackData);
          }
        })
        .catch((error: any) => {
          console.error('CashFree checkout error:', error);
          
          // Format error data
          const errorData: PaymentCallbackData = {
            orderStatus: 'CANCELLED',
            orderId: '',
            cfOrderId: '',
            txStatus: 'FAILED',
            txMsg: error.message || 'Payment failed due to an error',
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: ''
          };
          
          // Call failure callback
          onFailure?.(errorData);
        });
    } catch (error) {
      console.error('Error opening CashFree checkout:', error);
      
      // Format error data
      const errorData: PaymentCallbackData = {
        orderStatus: 'CANCELLED',
        orderId: '',
        cfOrderId: '',
        txStatus: 'FAILED',
        txMsg: error.message || 'Failed to open payment checkout',
        paymentSessionId,
        txTime: new Date().toISOString(),
        referenceId: ''
      };
      
      // Call failure callback
      onFailure?.(errorData);
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(orderId: string): Promise<{
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    amount: number;
    currency: string;
    paymentMethod?: string;
    paymentTime?: string;
    referenceId?: string;
  }> {
    try {
      console.log('🔍 Verifying payment status for order:', orderId);

      const response = await fetch(`/.netlify/functions/verify-payment?orderId=${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const result = await response.json();
      console.log('✅ Payment verification result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get supported payment methods
   */
  static async getPaymentMethods(): Promise<any> {
    try {
      await this.initialize();
      
      // This would typically come from your backend
      // For now, return common Indian payment methods
      return {
        netBanking: true,
        upi: true,
        cards: true,
        wallets: ['paytm', 'phonepe', 'googlepay'],
        emi: true
      };
    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      return null;
    }
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Generate unique order ID
   */
  static generateOrderId(prefix: string = 'ORDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than zero' };
    }
    
    if (amount < 1) {
      return { isValid: false, error: 'Minimum amount is ₹1' };
    }
    
    if (amount > 500000) {
      return { isValid: false, error: 'Maximum amount is ₹5,00,000' };
    }
    
    return { isValid: true };
  }

  /**
   * Check if SDK is ready
   */
  static isReady(): boolean {
    return this.initialized && this.cashfree !== null;
  }
}

export default CashFreeService;
