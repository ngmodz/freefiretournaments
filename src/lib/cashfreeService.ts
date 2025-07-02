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
      
      // Check if real CashFree credentials are configured
      const hasRealCredentials = import.meta.env.VITE_CASHFREE_APP_ID && 
                                !import.meta.env.VITE_CASHFREE_APP_ID.includes('your_') &&
                                !import.meta.env.VITE_CASHFREE_APP_ID.includes('YOUR_');
      
      console.log('🔍 Debug - App ID:', import.meta.env.VITE_CASHFREE_APP_ID);
      console.log('🔍 Debug - Has real credentials:', hasRealCredentials);
      
      const endpoint = hasRealCredentials ? '/api/create-payment-order' : '/api/mock-create-payment-order';
      
      console.log('🔍 Debug - Selected endpoint:', endpoint);
      
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

      console.log(`📡 Calling ${endpoint} (${hasRealCredentials ? 'REAL CASHFREE' : 'MOCK'} mode)`);

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

      // Check if real CashFree credentials are configured
      const hasRealCredentials = import.meta.env.VITE_CASHFREE_APP_ID && 
                                !import.meta.env.VITE_CASHFREE_APP_ID.includes('your_') &&
                                !import.meta.env.VITE_CASHFREE_APP_ID.includes('YOUR_');
      
      if (!hasRealCredentials) {
        console.log('🧪 Development mode: Simulating payment completion');
        
        // Show a confirmation dialog for development
        const confirmed = window.confirm(
          `🧪 DEVELOPMENT MODE\n\n` +
          `This would open CashFree checkout in production.\n` +
          `Click OK to simulate successful payment, Cancel to simulate failure.`
        );
        
        if (confirmed) {
          console.log('✅ Development: Simulating successful payment');
          const mockSuccessData: PaymentCallbackData = {
            orderStatus: 'PAID',
            orderId: `dev_order_${Date.now()}`,
            cfOrderId: `cf_${Date.now()}`,
            txStatus: 'SUCCESS',
            txMsg: 'Payment successful (development simulation)',
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: `ref_${Date.now()}`
          };
          
          // Simulate successful payment after a short delay
          setTimeout(() => {
            onSuccess?.(mockSuccessData);
            // Redirect to success page
            window.location.href = '/payment-status?status=success&orderId=' + mockSuccessData.orderId;
          }, 1000);
        } else {
          console.log('❌ Development: Simulating failed payment');
          const mockFailureData: PaymentCallbackData = {
            orderStatus: 'CANCELLED',
            orderId: `dev_order_${Date.now()}`,
            cfOrderId: `cf_${Date.now()}`,
            txStatus: 'CANCELLED',
            txMsg: 'Payment cancelled by user (development simulation)',
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: `ref_${Date.now()}`
          };
          onFailure?.(mockFailureData);
        }
        return;
      }

      // Production mode: Use actual CashFree checkout
      await this.initialize();

      if (!this.cashfree) {
        throw new Error('CashFree SDK not initialized');
      }

      console.log('🚀 Opening CashFree checkout popup with session ID:', paymentSessionId);

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,  // Ensure this is explicitly set
        redirectTarget: '_modal' // This opens in popup/modal
      };

      console.log('Checkout options:', checkoutOptions);

      const result = await this.cashfree.checkout(checkoutOptions);

      console.log('💳 Checkout initiated:', result);

      // Handle callback based on result
      if (result.error) {
        console.error('❌ Checkout error:', result.error);
        if (onFailure) {
          onFailure({
            orderStatus: 'TERMINATED',
            orderId: result.orderId || '',
            cfOrderId: result.cfOrderId || '',
            txStatus: 'FAILED',
            txMsg: result.error.message || 'Payment failed',
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: ''
          });
        }
        return;
      }

      // Handle redirect result
      if (result.redirect) {
        console.log('🔄 Checkout requires redirect');
        // In popup mode, this shouldn't happen
        return;
      }

      // Handle payment completion
      if (result.paymentDetails) {
        console.log('✅ Payment completed:', result.paymentDetails);
        if (onSuccess) {
          onSuccess({
            orderStatus: 'PAID',
            orderId: result.orderId,
            cfOrderId: result.cfOrderId,
            txStatus: 'SUCCESS',
            txMsg: 'Payment successful',
            paymentSessionId,
            txTime: result.paymentDetails.paymentTime || new Date().toISOString(),
            referenceId: result.paymentDetails.referenceId || '',
            paymentDetails: result.paymentDetails
          });
        }
      }

    } catch (error) {
      console.error('❌ Error opening checkout:', error);
      if (onFailure) {
        onFailure({
          orderStatus: 'TERMINATED',
          orderId: '',
          cfOrderId: '',
          txStatus: 'FAILED',
          txMsg: error instanceof Error ? error.message : 'Payment failed',
          paymentSessionId,
          txTime: new Date().toISOString(),
          referenceId: ''
        });
      }
      throw error;
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
