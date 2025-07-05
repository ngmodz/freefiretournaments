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
  // Global payment monitoring
  private static paymentMonitorActive = false;
  private static paymentStartTime: number | null = null;

  /**
   * Initialize CashFree SDK
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing CashFree SDK...');
      console.log('🔧 Config:', {
        appId: cashfreeConfig.appId ? cashfreeConfig.appId.substring(0, 10) + '...' : 'MISSING',
        environment: cashfreeConfig.environment,
        apiVersion: cashfreeConfig.apiVersion
      });
      
      // Validate configuration
      if (!cashfreeConfig.appId) {
        throw new Error('CashFree App ID is required. Please check your environment variables.');
      }

      // Ensure environment is valid
      const validEnvironment = cashfreeConfig.environment?.toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox';
      console.log('🌍 Using environment:', validEnvironment);

      // Load CashFree SDK
      this.cashfree = await load({
        mode: validEnvironment as 'sandbox' | 'production'
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
    creditsAmount?: number;
  }): Promise<CashFreeOrderResponse> {
    try {
      console.log('📝 Creating payment order:', orderData);

      // Generate shorter order ID to meet CashFree's 50 character limit
      const shortUserId = orderData.userId.substring(0, 8); // First 8 chars of userId
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const orderId = `${orderData.packageType.substring(0, 4)}_${shortUserId}_${timestamp}`;
      
      // Use the existing API endpoint
      const endpoint = '/api/create-payment-order';
      
      console.log('🔍 Debug - Using CORRECT Cashfree API endpoint:', endpoint);
      
      // Send data in the format expected by the API
      const requestData = {
        amount: orderData.amount,
        userId: orderData.userId,
        userName: orderData.userName,
        userEmail: orderData.userEmail,
        userPhone: orderData.userPhone,
        packageId: orderData.packageId || '',
        packageName: orderData.packageName || '',
        packageType: orderData.packageType,
        creditsAmount: orderData.creditsAmount
      };

      console.log(`📡 Calling ${endpoint} for Cashfree payment`);

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

      // Start global payment monitoring
      this.startGlobalPaymentMonitor();
      
      // Setup PWA-specific failsafes
      this.setupPWAFailsafes();

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal'
      };

      console.log('Checkout options:', checkoutOptions);

      // Set up conservative payment monitoring and fallback systems
      let paymentCompleted = false;
      let paymentTimeoutId: NodeJS.Timeout | null = null;
      let modalClosedCheckId: NodeJS.Timeout | null = null;
      let paymentOpenTime = Date.now();
      
      // Create conservative monitoring system - only triggers on real failures
      const setupPaymentMonitoring = () => {
        // 1. Main payment timeout (15 minutes) - much longer to allow for slow payments
        paymentTimeoutId = setTimeout(() => {
          if (!paymentCompleted) {
            console.log('⏰ Payment timeout after 15 minutes - redirecting to home');
            completePayment('timeout');
          }
        }, 15 * 60 * 1000);

        // 2. Conservative modal monitoring - only check if modal was actually closed by user
        let modalWasVisible = false;
        let consecutiveModalMissingCount = 0;
        
        const checkModalStatus = () => {
          if (paymentCompleted) return;
          
          // Only start monitoring after payment has been open for at least 5 seconds
          if (Date.now() - paymentOpenTime < 5000) {
            setTimeout(checkModalStatus, 2000);
            return;
          }
          
          // Check for payment failure indicators in the DOM first
          const failureTexts = [
            'payment failed',
            'oh no!',
            'payment error',
            'transaction failed',
            'payment cancelled',
            'transaction cancelled',
            'simulated response message',
            'facing problems with upi'
          ];
          
          const failureElements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return failureTexts.some(failureText => text.includes(failureText));
            });
          
          if (failureElements.length > 0) {
            console.log('🚨 Payment failure detected in DOM - redirecting to home');
            console.log('Failure elements found:', failureElements.map(el => el.textContent));
            completePayment('payment-failed-detected');
            return;
          }
          
          const modalElements = [
            document.querySelector('[data-testid="modal"]'),
            document.querySelector('.cashfree-modal'),
            document.querySelector('[class*="modal"]'),
            document.querySelector('[class*="popup"]'),
            document.querySelector('iframe[src*="cashfree"]'),
            document.querySelector('iframe[src*="payments"]'),
            // Add more specific Cashfree selectors
            document.querySelector('[class*="cashfree"]'),
            document.querySelector('[id*="cashfree"]'),
            document.querySelector('[class*="payment"]')
          ];
          
          const visibleModal = modalElements.find(el => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          
          if (visibleModal) {
            modalWasVisible = true;
            consecutiveModalMissingCount = 0;
            
            // Check if the visible modal contains failure content
            const modalText = visibleModal.textContent?.toLowerCase() || '';
            const hasFailureContent = failureTexts.some(failureText => modalText.includes(failureText));
            
            if (hasFailureContent) {
              console.log('🚨 Payment failure modal detected - redirecting to home');
              completePayment('failure-modal-detected');
              return;
            }
          } else if (modalWasVisible) {
            // Modal was visible before but now it's gone - user might have closed it
            consecutiveModalMissingCount++;
            console.log(`🔍 Payment modal missing (${consecutiveModalMissingCount}/3)`);
            
            // Only trigger after modal is missing for 3 consecutive checks (15 seconds)
            if (consecutiveModalMissingCount >= 3) {
              console.log('🏠 Payment modal consistently missing - user likely closed popup');
              completePayment('modal-closed');
              return;
            }
          }
          
          // Check again in 5 seconds
          setTimeout(checkModalStatus, 5000);
        };
        
        // Start modal monitoring immediately
        setTimeout(checkModalStatus, 2000);

        // Add backend polling to check payment status
        let pollCount = 0;
        const maxPolls = 60; // Poll for 5 minutes max (every 5 seconds)
        
        const pollPaymentStatus = async () => {
          if (paymentCompleted || pollCount >= maxPolls) return;
          
          pollCount++;
          
          try {
            // Extract order ID from session ID for polling
            const sessionParts = paymentSessionId.split('_');
            const orderIdMatch = sessionParts.find(part => part.includes('tour_') || part.includes('host_'));
            
            if (orderIdMatch) {
              const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderIdMatch })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log(`🔍 Poll ${pollCount}: Payment status:`, result.status);
                
                if (result.status === 'FAILED') {
                  console.log('🚨 Backend polling detected payment failure - redirecting');
                  completePayment('backend-polling-failed');
                  return;
                } else if (result.status === 'SUCCESS') {
                  console.log('✅ Backend polling detected payment success');
                  // Let the normal success flow handle this
                  return;
                }
              }
            }
          } catch (error) {
            console.log('Polling error (non-critical):', error);
          }
          
          // Continue polling every 5 seconds
          setTimeout(pollPaymentStatus, 5000);
        };
        
        // Start polling after 10 seconds
        setTimeout(pollPaymentStatus, 10000);

        // 3. Conservative escape key handling only
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape' && !paymentCompleted) {
            // Only trigger escape after payment has been open for at least 5 seconds
            if (Date.now() - paymentOpenTime > 5000) {
              console.log('🔍 Escape key pressed after payment opened - user cancelled');
              completePayment('escape');
            }
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Cleanup function
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          if (paymentTimeoutId) clearTimeout(paymentTimeoutId);
          if (modalClosedCheckId) clearTimeout(modalClosedCheckId);
        };
      };

      // Complete payment and cleanup
      const completePayment = (reason: string) => {
        if (paymentCompleted) return;
        paymentCompleted = true;
        cleanup();
        
        // Stop global monitoring
        this.stopGlobalPaymentMonitor();
        
        console.log(`🏁 Completing payment due to: ${reason}`);
        
        // Force close any remaining modals
        try {
          const modals = document.querySelectorAll('[data-testid="modal"], .cashfree-modal, [class*="modal"], [class*="popup"]');
          modals.forEach(modal => {
            if (modal instanceof HTMLElement) {
              modal.style.display = 'none';
              modal.remove();
            }
          });
          
          // Force close any iframes
          const iframes = document.querySelectorAll('iframe[src*="cashfree"], iframe[src*="payments"]');
          iframes.forEach(iframe => {
            if (iframe instanceof HTMLElement) {
              iframe.remove();
            }
          });
        } catch (error) {
          console.log('Error cleaning up modals:', error);
        }
        
        // Navigate to home with failure indication
        window.location.href = '/';
      };

      const cleanup = setupPaymentMonitoring();

      // Open the checkout popup with enhanced error handling
      this.cashfree
        .checkout(checkoutOptions)
        .then((result: any) => {
          console.log('CashFree checkout result:', result);
          console.log('🔍 Full CashFree result object:', JSON.stringify(result, null, 2));
          
          // Mark payment as completed to stop monitoring
          if (!paymentCompleted) {
            paymentCompleted = true;
            cleanup();
            this.stopGlobalPaymentMonitor();
          }
          
          // Handle payment result based on status
          if (result.status === 'OK' || result.status === 'SUCCESS') {
            console.log('✅ Payment successful:', result);
            
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
            console.log('❌ Payment failed or cancelled:', result);
            console.log('🚨 Payment failure details:', {
              status: result.status,
              order: result.order,
              transaction: result.transaction,
              error: result.error
            });
            
            // For any non-success result, redirect to home immediately
            console.log('🏠 Non-success payment result - redirecting to home');
            window.location.href = '/';
          }
        })
        .catch((error: any) => {
          console.error('❌ CashFree checkout error:', error);
          
          // Mark payment as completed to stop monitoring
          if (!paymentCompleted) {
            paymentCompleted = true;
            cleanup();
            this.stopGlobalPaymentMonitor();
          }
          
          // For any error, redirect to home immediately
          console.log('🏠 Payment error occurred - redirecting to home');
          window.location.href = '/';
        });

      // Add safety net - if no result after 10 minutes, assume failure
      setTimeout(() => {
        if (!paymentCompleted) {
          console.log('⚠️ No payment response after 10 minutes - assuming failure');
          completePayment('no-response');
        }
      }, 10 * 60 * 1000);

    } catch (error) {
      console.error('❌ Error opening CashFree checkout:', error);
      
      // For any initialization error, redirect to home immediately
      console.log('🏠 Checkout initialization error - redirecting to home');
      window.location.href = '/';
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

      const response = await fetch(`/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId
        })
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

  /**
   * Start conservative global payment failure detection
   */
  private static startGlobalPaymentMonitor(): void {
    if (this.paymentMonitorActive) return;
    
    this.paymentMonitorActive = true;
    this.paymentStartTime = Date.now();
    
    console.log('🔍 Starting conservative global payment monitor');
    
    // Check every 10 seconds for genuinely stuck payment states
    const monitorInterval = setInterval(() => {
      if (!this.paymentMonitorActive) {
        clearInterval(monitorInterval);
        return;
      }
      
      const timeSinceStart = Date.now() - (this.paymentStartTime || 0);
      
      // Check for failure indicators more frequently in the first few minutes
      if (timeSinceStart > 30 * 1000) { // After 30 seconds
        console.log('⚠️ Checking for payment failure indicators');
        
        // Check for actual error indicators in the DOM
        const errorElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('payment failed') || 
                   text.includes('transaction failed') ||
                   text.includes('payment error') ||
                   text.includes('payment cancelled') ||
                   text.includes('transaction cancelled') ||
                   text.includes('oh no!') ||
                   text.includes('simulated response message') ||
                   text.includes('facing problems with upi');
          });
        
        if (errorElements.length > 0) {
          console.log('🚨 Genuine payment error detected in DOM - redirecting to home');
          console.log('Error elements:', errorElements.map(el => el.textContent));
          this.stopGlobalPaymentMonitor();
          window.location.href = '/';
        }
      }
      
      // Force exit after 20 minutes regardless
      if (timeSinceStart > 20 * 60 * 1000) {
        console.log('⏰ Force exit after 20 minutes - redirecting to home');
        this.stopGlobalPaymentMonitor();
        window.location.href = '/';
      }
    }, 10000); // Check every 10 seconds instead of 30
  }

  /**
   * Stop global payment monitoring
   */
  private static stopGlobalPaymentMonitor(): void {
    this.paymentMonitorActive = false;
    this.paymentStartTime = null;
    console.log('🛑 Stopped global payment monitor');
  }

  /**
   * Conservative PWA-specific payment failure detection
   */
  private static setupPWAFailsafes(): void {
    // Conservative detection when PWA comes back to foreground after payment attempt
    let appBecameActiveTime = 0;
    
    const handleAppStateChange = () => {
      if (this.paymentMonitorActive && !document.hidden) {
        appBecameActiveTime = Date.now();
        console.log('📱 PWA became active during payment');
        
        // Only check for stuck state after app has been active for 30 seconds
        setTimeout(() => {
          if (this.paymentMonitorActive && Date.now() - appBecameActiveTime >= 30000) {
            console.log('🚨 PWA active for 30+ seconds but payment still running - likely stuck');
            this.stopGlobalPaymentMonitor();
            window.location.href = '/';
          }
        }, 30000);
      }
    };

    // Mobile-specific events - but with delays
    document.addEventListener('visibilitychange', handleAppStateChange);
    window.addEventListener('pageshow', handleAppStateChange);
    window.addEventListener('focus', handleAppStateChange);
    
    // PWA app state events
    if ('serviceWorker' in navigator) {
      window.addEventListener('beforeunload', () => {
        if (this.paymentMonitorActive) {
          console.log('📱 PWA beforeunload during payment - will check on return');
          localStorage.setItem('paymentInProgress', Date.now().toString());
        }
      });
      
      // Check on app startup if payment was in progress - but be more conservative
      const paymentWasInProgress = localStorage.getItem('paymentInProgress');
      if (paymentWasInProgress) {
        const timeSince = Date.now() - parseInt(paymentWasInProgress);
        if (timeSince < 30 * 60 * 1000) { // Less than 30 minutes ago (increased from 10)
          console.log('📱 PWA restarted with recent payment in progress - redirecting to home');
          localStorage.removeItem('paymentInProgress');
          setTimeout(() => window.location.href = '/', 2000); // Increased delay
        } else {
          localStorage.removeItem('paymentInProgress');
        }
      }
    }
  }
}

export default CashFreeService;
