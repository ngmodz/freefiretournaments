import { load } from '@cashfreepayments/cashfree-js';

// CashFree Configuration
export const cashfreeConfig = {
  appId: import.meta.env.VITE_CASHFREE_APP_ID?.trim(),
  environment: (import.meta.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX').trim(),
  apiVersion: (import.meta.env.VITE_CASHFREE_API_VERSION || '2025-01-01').trim(),
  baseUrl: (import.meta.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX').trim() === 'PRODUCTION' 
    ? import.meta.env.VITE_CASHFREE_PRODUCTION_URL?.trim()
    : import.meta.env.VITE_CASHFREE_SANDBOX_URL?.trim(),
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

export interface CashFreeAPIResponse {
  success: boolean;
  order_id: string;
  payment_session_id: string;
  order_status: string;
  payment_link?: string;
}

export interface PaymentCallbackData {
  orderStatus: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TERMINATED' | 'FAILED';
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
    if (this.initialized) {
      console.log('✅ CashFree SDK already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing CashFree SDK...');
      console.log('🔧 Config:', {
        appId: cashfreeConfig.appId ? cashfreeConfig.appId.substring(0, 10) + '...' : 'MISSING',
        environment: cashfreeConfig.environment,
        apiVersion: cashfreeConfig.apiVersion
      });
      
      // Validate configuration
      if (!cashfreeConfig.appId) {
        console.error('❌ CRITICAL: CashFree App ID is missing');
        throw new Error('CashFree App ID is required. Please check your environment variables.');
      }

      // Ensure environment is valid
      const validEnvironment = cashfreeConfig.environment?.toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox';
      console.log('🌍 Using environment:', validEnvironment);

      // Check if the load function is available
      console.log('📦 Checking if Cashfree load function is available...');
      if (typeof load !== 'function') {
        console.error('❌ CRITICAL: Cashfree load function is not available');
        throw new Error('Cashfree SDK load function is not available. Check if the package is installed correctly.');
      }

      console.log('📦 Loading CashFree SDK...');
      
      // Load CashFree SDK
      this.cashfree = await load({
        mode: validEnvironment as 'sandbox' | 'production'
      });

      if (!this.cashfree) {
        console.error('❌ CRITICAL: CashFree SDK load returned null/undefined');
        throw new Error('Failed to load CashFree SDK - returned null');
      }

      console.log('✅ CashFree SDK object created:', typeof this.cashfree);
      console.log('🔍 Available methods:', Object.keys(this.cashfree || {}));

      this.initialized = true;
      console.log('✅ CashFree SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CashFree SDK:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error
      });
      throw new Error(`Failed to initialize payment gateway: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  }): Promise<CashFreeAPIResponse> {
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

      const orderResponse = await response.json();
      console.log('✅ Payment order created:', orderResponse);

      if (!orderResponse.success) {
        const errorDetails = orderResponse.details || JSON.stringify(orderResponse);
        throw new Error(`Failed to create payment order: ${errorDetails}`);
      }

      return orderResponse;
    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Open CashFree checkout popup with proper error handling according to Cashfree documentation
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
        console.error('❌ Payment session ID is missing');
        throw new Error('Payment session ID is missing or undefined');
      }

      // Initialize the Cashfree SDK
      console.log('⚙️ Initializing Cashfree SDK...');
      await this.initialize();

      if (!this.cashfree) {
        console.error('❌ CashFree SDK failed to initialize');
        throw new Error('CashFree SDK not initialized');
      }

      console.log('✅ CashFree SDK ready, opening checkout popup...');
      console.log('🔧 Checkout options:', {
        paymentSessionId: paymentSessionId.substring(0, 20) + '...',
        redirectTarget: '_modal'
      });
      
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal' // Use modal for popup experience
      };
      
      // Track checkout promise resolution
      let checkoutResolved = false;
      
      console.log('🚀 Calling cashfree.checkout()...');
      
      // Open checkout and handle the promise result according to Cashfree documentation
      const checkoutPromise = this.cashfree.checkout(checkoutOptions);
      
      console.log('📞 Checkout method called, waiting for result...');
      
      checkoutPromise
        .then((result: any) => {
          checkoutResolved = true;
          console.log('✅ Cashfree checkout completed with result:', result);
          console.log('🔍 Full result object:', JSON.stringify(result, null, 2));
          
          // Handle based on Cashfree's documented result structure
          this.processPaymentResult(result, paymentSessionId, onSuccess, onFailure, onCancel);
        })
        .catch((error: any) => {
          checkoutResolved = true;
          console.error('❌ Cashfree checkout promise rejected with error:', error);
          console.error('🔍 Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            type: typeof error
          });
          
          // Handle different types of errors
          this.handleCheckoutError(error, paymentSessionId, onFailure);
        });

      // Shorter timeout for debugging - 30 seconds instead of 60
      setTimeout(() => {
        if (!checkoutResolved) {
          console.log('⏰ CHECKOUT TIMEOUT - checkout promise has not resolved within 30 seconds');
          console.log('🚨 This indicates the checkout popup may not have opened properly');
          console.log('💡 Possible causes: SDK not loaded, invalid session ID, or popup blocked');
          
          if (onFailure) {
            const failureData: PaymentCallbackData = {
              orderStatus: 'FAILED',
              orderId: '',
              cfOrderId: '',
              txStatus: 'FAILED',
              txMsg: 'Payment timeout - checkout did not complete',
              paymentSessionId,
              txTime: new Date().toISOString(),
              referenceId: ''
            };
            onFailure(failureData);
          }
          
          // Force redirect to home
          window.location.href = '/';
        }
      }, 30000); // 30 second timeout for debugging

      // Add DOM monitoring for Cashfree failure popups with delay to avoid false positives
      console.log('[CashfreeService] Starting failure monitoring with 10-second delay to allow user interaction...');
      setTimeout(() => {
        console.log('[CashfreeService] Now starting failure monitoring after delay...');
        this.monitorForCashfreeFailurePopup(paymentSessionId, onFailure);
      }, 10000); // Wait 10 seconds before starting monitoring
      
    } catch (error) {
      console.error('❌ Critical error in openCheckout:', error);
      console.error('🔍 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // DON'T redirect immediately - let user see the error first
      console.log('🚨 NOT redirecting immediately to allow debugging');
      
      // Call failure callback if provided, but don't redirect
      if (onFailure) {
        const failureData: PaymentCallbackData = {
          orderStatus: 'TERMINATED',
          orderId: '',
          cfOrderId: '',
          txStatus: 'FAILED',
          txMsg: `Checkout initialization error: ${error}`,
          paymentSessionId,
          txTime: new Date().toISOString(),
          referenceId: ''
        };
        console.log('🔄 Calling onFailure callback with data:', failureData);
        onFailure(failureData);
      }
      
      // Show alert instead of immediate redirect for debugging
      alert(`Checkout Error: ${error}\n\nCheck console for details. Page will redirect in 5 seconds.`);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    }
  }

  /**
   * Process payment result according to Cashfree documentation
   */
  private static processPaymentResult(
    result: any,
    paymentSessionId: string,
    onSuccess?: (data: PaymentCallbackData) => void,
    onFailure?: (data: PaymentCallbackData) => void,
    onCancel?: () => void
  ): void {
    
    // Check for immediate error in result (as per documentation)
    if (result.error) {
      console.log('❌ Payment failed or cancelled:', result.error);
      
      const errorMessage = this.getUserFriendlyErrorMessage(result.error.code, result.error.message);
      
      const failureData: PaymentCallbackData = {
        orderStatus: 'TERMINATED',
        orderId: result.order?.order_id || result.order?.id || '',
        cfOrderId: result.order?.cf_order_id || result.order?.cfOrderId || '',
        txStatus: 'FAILED',
        txMsg: errorMessage,
        paymentSessionId,
        txTime: new Date().toISOString(),
        referenceId: result.transaction?.referenceId || ''
      };
      
      // Call failure callback if provided
      if (onFailure) {
        onFailure(failureData);
      }
      
      // Redirect to home
      window.location.href = '/';
      return;
    }

    // Process payment details (as per documentation)
    if (result.paymentDetails) {
      const { order_status, payment_status, payment_message, cf_payment_id, order_id } = result.paymentDetails;

      switch (order_status) {
        case 'PAID':
          console.log('💰 Payment successful!');
          
          const successData: PaymentCallbackData = {
            orderStatus: 'PAID',
            orderId: order_id || '',
            cfOrderId: cf_payment_id || '',
            txStatus: 'SUCCESS',
            txMsg: 'Payment successful',
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: cf_payment_id || ''
          };
          
          if (onSuccess) {
            onSuccess(successData);
          }
          break;

        case 'FAILED':
          console.log('❌ Payment failed:', payment_message);
          
          const failureMessage = payment_message || 'Payment processing failed';
          const failureData: PaymentCallbackData = {
            orderStatus: 'FAILED',
            orderId: order_id || '',
            cfOrderId: cf_payment_id || '',
            txStatus: 'FAILED',
            txMsg: failureMessage,
            paymentSessionId,
            txTime: new Date().toISOString(),
            referenceId: cf_payment_id || ''
          };
          
          if (onFailure) {
            onFailure(failureData);
          }
          
          window.location.href = '/';
          break;

        case 'CANCELLED':
          console.log('🚫 Payment cancelled by user');
          
          if (onCancel) {
            onCancel();
          }
          
          // Show cancellation message and redirect
          this.showPaymentCancelledOverlay(() => {
            window.location.href = '/';
          });
          break;

        case 'PENDING':
          console.log('⏳ Payment is pending');
          
          // For pending payments, redirect to a status page instead of home
          window.location.href = `/payment-status?orderId=${order_id}&status=pending`;
          break;

        case 'INCOMPLETE':
          console.log('⚠️ Payment incomplete');
          
          window.location.href = '/';
          break;

        default:
          console.warn('❓ Unknown order status:', order_status);
          
          // For unknown status, redirect to home
          window.location.href = '/';
      }
    } else {
      console.warn('⚠️ No payment details in result');
      
      // No payment details available - redirect to home
      window.location.href = '/';
    }
  }

  /**
   * Handle checkout errors according to Cashfree documentation
   */
  private static handleCheckoutError(
    error: any,
    paymentSessionId: string,
    onFailure?: (data: PaymentCallbackData) => void
  ): void {
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    // Handle different types of errors
    if (error.name === 'TypeError') {
      errorMessage = 'Network error occurred. Please check your internet connection.';
    } else if (error.code) {
      errorMessage = this.getUserFriendlyErrorMessage(error.code, error.message);
    }
    
    const failureData: PaymentCallbackData = {
      orderStatus: 'TERMINATED',
      orderId: '',
      cfOrderId: '',
      txStatus: 'FAILED',
      txMsg: errorMessage,
      paymentSessionId,
      txTime: new Date().toISOString(),
      referenceId: ''
    };
    
    if (onFailure) {
      onFailure(failureData);
    }
    
    // Redirect to home
    window.location.href = '/';
  }

  /**
   * Get user-friendly error message based on Cashfree error codes
   */
  private static getUserFriendlyErrorMessage(errorCode: string, defaultMessage: string): string {
    const errorCodeMessages: { [key: string]: string } = {
      'TRANSACTION_DECLINED': 'Your bank declined the transaction. Please try a different payment method.',
      'GATEWAY_ERROR': 'Payment gateway error occurred. Please try again later.',
      'INVALID_AMOUNT': 'Invalid payment amount. Please refresh the page and try again.',
      'BANK_PROCESSING_FAILURE': 'Bank processing failed. Please try again or contact your bank.',
      'API_REQUEST_TIMEOUT': 'Payment request timed out. Please check your internet connection and try again.',
      'PAYMENT_SESSION_ID_INVALID': 'Payment session expired. Please refresh the page and try again.',
      'ORDER_ID_INVALID': 'Order information is invalid. Please contact support.',
      'CARD_UNSUPPORTED': 'This card type is not supported. Please try a different card.',
      'PAYMENT_METHOD_UNSUPPORTED': 'This payment method is not supported. Please choose a different option.'
    };

    return errorCodeMessages[errorCode] || defaultMessage || 'Payment failed. Please try again.';
  }

  /**
   * Monitor for Cashfree failure popup and handle it immediately
   * Simplified and more aggressive monitoring to catch all failures
   */
  private static monitorForCashfreeFailurePopup(
    paymentSessionId: string,
    onFailure?: (data: PaymentCallbackData) => void
  ): void {
    console.log('[CashfreeService] IMMEDIATE monitoring started');
    
    let monitoringActive = true;
    let checkCount = 0;
    const maxChecks = 300; // Monitor for 5 minutes max (300 * 1000ms)
    
    const checkForFailurePopup = () => {
      try {
        if (!monitoringActive || checkCount >= maxChecks) {
          console.log('[CashfreeService] Monitoring stopped', { monitoringActive, checkCount, maxChecks });
          monitoringActive = false;
          return;
        }
        
        checkCount++;
        
        let bodyText = '';
        let bodyHTML = '';
        
        try {
          bodyText = document.body.textContent?.toLowerCase() || '';
          bodyHTML = document.body.innerHTML?.toLowerCase() || '';
          
          // Only log DOM read success on every 10th check to reduce noise
          if (checkCount % 10 === 0) {
            console.log(`[CashfreeService] Check #${checkCount}: Successfully read DOM content, text length: ${bodyText.length}, HTML length: ${bodyHTML.length}`);
          }
        } catch (domError) {
          console.error('[CashfreeService] Failed to read DOM:', domError);
          // Continue monitoring even if DOM read fails
          setTimeout(checkForFailurePopup, 500);
          return;
        }
        
        // Comprehensive failure detection - looking for ANY failure indicators from your screenshots
        const failurePatterns = [
          'payment failed',
          'payment not completed', 
          'transaction failed',
          'transaction not completed',
          'oh no!',
          'oh no',
          'facing problems',
          'payment has failed',
          'payment cancelled',
          'cancelled by user',
          'something went wrong',
          'error occurred',
          'payment error',
          'transaction error',
          'insufficient balance',
          'card declined',
          'bank declined',
          'payment declined',
          'authorization failed',
          'timeout',
          'network error',
          'simulated response message',
          'simulated response',
          'facing problems with upi',
          'use different payment method',
          'payment was not successful',
          'payment unsuccessful',
          'oops',
          'payment could not be processed',
          'unable to process',
          'expired card',
          'invalid card',
          'server error',
          'upi failed',
          'wallet failed'
        ];
        
        const retryPatterns = [
          'retry payment',
          'try again later',
          'back to merchant',
          'use different payment method'
        ];
        
        // Check for failure text with detailed logging
        let hasFailureText = false;
        let matchedFailurePattern = '';
        
        try {
          for (const pattern of failurePatterns) {
            if (bodyText.includes(pattern) || bodyHTML.includes(pattern)) {
              hasFailureText = true;
              matchedFailurePattern = pattern;
              console.log(`[CashfreeService] FAILURE PATTERN MATCHED: "${pattern}"`);
              break;
            }
          }
        } catch (patternError) {
          console.error('[CashfreeService] Error checking failure patterns:', patternError);
        }
        
        let hasRetryText = false;
        let matchedRetryPattern = '';
        
        try {
          for (const pattern of retryPatterns) {
            if (bodyText.includes(pattern) || bodyHTML.includes(pattern)) {
              hasRetryText = true;
              matchedRetryPattern = pattern;
              console.log(`[CashfreeService] RETRY PATTERN MATCHED: "${pattern}"`);
              break;
            }
          }
        } catch (retryPatternError) {
          console.error('[CashfreeService] Error checking retry patterns:', retryPatternError);
        }
        
        // Check modals for failure indicators with detailed logging
        let hasFailureModal = false;
        let hasErrorIcon = false;
        let modalCount = 0;
        
        try {
          const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], iframe[src*="cashfree"], [class*="cf-"], [id*="modal"], [id*="popup"]');
          modalCount = modals.length;
          
          // Only log modal count on every 10th check to reduce noise
          if (checkCount % 10 === 0) {
            console.log(`[CashfreeService] Found ${modals.length} potential modal elements`);
          }
          
          modals.forEach((modal, index) => {
            if (modal instanceof HTMLElement && modal.offsetHeight > 0 && modal.offsetWidth > 0) {
              const modalText = modal.textContent?.toLowerCase() || '';
              const modalHTML = modal.innerHTML?.toLowerCase() || '';
              
              // Check for failure text in modals
              for (const pattern of failurePatterns) {
                if (modalText.includes(pattern)) {
                  hasFailureModal = true;
                  console.log(`[CashfreeService] FAILURE IN MODAL: "${pattern}" found in modal ${index}`);
                  break;
                }
              }
              
              // Check for error icons or elements
              if (modalHTML.includes('error') || modalHTML.includes('warning') || 
                  modalHTML.includes('alert') || modalHTML.includes('cross') ||
                  modalHTML.includes('✕') || modalHTML.includes('×') ||
                  modalHTML.includes('!')) {
                hasErrorIcon = true;
                console.log(`[CashfreeService] ERROR ICON found in modal ${index}`);
              }
            }
          });
        } catch (modalError) {
          console.error('[CashfreeService] Error checking modals:', modalError);
        }
        
        // Check for error buttons or links with detailed logging
        let hasErrorUI = false;
        
        try {
          const buttons = document.querySelectorAll('button, a, [role="button"], [class*="btn"]');
          
          // Only log button count on every 10th check to reduce noise
          if (checkCount % 10 === 0) {
            console.log(`[CashfreeService] Found ${buttons.length} buttons/links to check`);
          }
          
          buttons.forEach((button, index) => {
            const buttonText = button.textContent?.toLowerCase() || '';
            for (const pattern of retryPatterns) {
              if (buttonText.includes(pattern) && (buttonText.includes('payment') || buttonText.includes('transaction'))) {
                hasErrorUI = true;
                console.log(`[CashfreeService] ERROR UI found in button ${index}: "${buttonText}"`);
                break;
              }
            }
          });
        } catch (buttonError) {
          console.error('[CashfreeService] Error checking buttons:', buttonError);
        }
        
        // Determine if this is a failure - ONLY trigger on explicit failure conditions
        // Be very conservative to avoid false positives
        
        // RULE 1: Explicit failure text anywhere on page
        const explicitFailure = hasFailureText;
        
        // RULE 2: Modal with explicit failure content (not just error icons)
        const modalFailure = hasFailureModal;
        
        // RULE 3: VERY specific error condition - must have BOTH:
        //   a) Multiple failure indicators (not just generic "error" or "!")
        //   b) Explicit payment/transaction related failure text
        const specificErrorCondition = hasErrorIcon && hasRetryText && modalCount > 0 && 
                                      (matchedFailurePattern.includes('payment') || 
                                       matchedFailurePattern.includes('transaction') || 
                                       matchedFailurePattern.includes('failed') ||
                                       matchedFailurePattern.includes('error'));
        
        const isFailureDetected = explicitFailure || modalFailure || specificErrorCondition;
        
        // DEBUG: Only log detailed evaluation if we have any indicators
        if (hasErrorIcon || hasRetryText || hasFailureText || hasFailureModal) {
          console.log('🔍 FAILURE DETECTION EVALUATION:', {
            hasFailureText,
            matchedFailurePattern,
            hasFailureModal, 
            hasErrorIcon,
            hasRetryText,
            matchedRetryPattern,
            modalCount,
            explicitFailure,
            modalFailure,
            specificErrorCondition,
            finalResult: isFailureDetected
          });
        }
        
        if (isFailureDetected) {
          console.log('🚨 FAILURE DETECTED - stopping payment process');
          console.log('📊 Detection details:', {
            hasFailureText,
            matchedFailurePattern,
            hasFailureModal,
            hasRetryText,
            matchedRetryPattern,
            hasErrorIcon,
            hasErrorUI,
            modalCount,
            errorIconWithRetryAndModal: hasErrorIcon && hasRetryText && modalCount > 0,
            checkCount,
            timeElapsed: checkCount + ' seconds',
            bodyTextSample: bodyText.substring(0, 300)
          });
          
          monitoringActive = false;
          
          // Call failure callback immediately
          if (onFailure) {
            const failureData: PaymentCallbackData = {
              orderStatus: 'FAILED',
              orderId: '',
              cfOrderId: '',
              txStatus: 'FAILED',
              txMsg: `Payment failed - detected from UI: ${matchedFailurePattern || 'modal failure'}`,
              paymentSessionId,
              txTime: new Date().toISOString(),
              referenceId: ''
            };
            onFailure(failureData);
          }
          
          // IMMEDIATE AGGRESSIVE MODAL CLOSING - don't wait
          console.log('🔨 AGGRESSIVELY CLOSING ALL MODALS NOW');
          
          // Multiple attempts to close modals with different strategies
          for (let attempt = 0; attempt < 5; attempt++) {
            setTimeout(() => {
              try {
                console.log(`🔨 Modal closing attempt ${attempt + 1}`);
                
                // Strategy 1: Close by very broad selectors
                const allModals = document.querySelectorAll(`
                  div[class*="modal"], div[class*="popup"], div[class*="overlay"],
                  div[class*="cf"], div[class*="cashfree"], div[class*="payment"],
                  iframe, div[style*="position: fixed"], div[style*="position: absolute"],
                  [id*="modal"], [id*="popup"], [id*="cashfree"], [id*="cf"]
                `);
                
                console.log(`Found ${allModals.length} potential modal elements to close`);
                
                allModals.forEach((element, index) => {
                  if (element instanceof HTMLElement) {
                    console.log(`Closing element ${index}:`, element.tagName, element.className);
                    element.style.display = 'none !important';
                    element.style.visibility = 'hidden !important';
                    element.style.opacity = '0 !important';
                    element.style.zIndex = '-9999 !important';
                    element.remove();
                  }
                });
                
                // Strategy 2: Close by text content (find elements containing failure text)
                const allDivs = document.querySelectorAll('div');
                allDivs.forEach(div => {
                  const text = div.textContent?.toLowerCase() || '';
                  if (text.includes('oh no') || text.includes('payment failed') || 
                      text.includes('facing problems') || text.includes('simulated response')) {
                    console.log('Closing element with failure text:', div);
                    div.style.display = 'none !important';
                    div.style.visibility = 'hidden !important';
                    div.remove();
                  }
                });
                
                // Strategy 3: Nuclear option - hide entire body content except our overlay
                if (attempt === 2) {
                  console.log('🚨 NUCLEAR OPTION - Hiding body content');
                  document.body.style.overflow = 'hidden';
                  const bodyChildren = Array.from(document.body.children);
                  bodyChildren.forEach(child => {
                    if (child.id !== 'custom-payment-failure-overlay' && child instanceof HTMLElement) {
                      child.style.display = 'none';
                    }
                  });
                }
                
              } catch (e) {
                console.log(`Error in modal closing attempt ${attempt + 1}:`, e);
              }
            }, attempt * 50); // 0ms, 50ms, 100ms, 150ms, 200ms
          }
          
          // Redirect to home immediately
          window.location.href = '/';
          
          return;
        }
        
        // Log every 10th check to show monitoring is active
        if (checkCount % 10 === 0) {
          console.log(`[CashfreeService] Monitoring active, check ${checkCount}/${maxChecks}, no failure detected yet`);
          console.log(`[CashfreeService] Current page text sample:`, bodyText.substring(0, 200));
        }
        
        // Continue monitoring more frequently
        setTimeout(checkForFailurePopup, 500);
        
      } catch (error) {
        console.error('[CashfreeService] CRITICAL ERROR in failure monitoring:', error);
        console.error('[CashfreeService] Error stack:', error.stack);
        
        // Still try to continue monitoring even if there's an error
        setTimeout(checkForFailurePopup, 1000);
      }
    };
    
    // Start monitoring IMMEDIATELY - no delay
    console.log('[CashfreeService] Starting first monitoring check immediately...');
    checkForFailurePopup();
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
   * Show custom overlay for payment cancellation
   */
  static showPaymentCancelledOverlay(onRedirect: () => void): void {
    console.log('🚫 Showing payment cancelled overlay');
    
    try {
      // Check if overlay already exists
      if (document.getElementById('custom-payment-cancelled-overlay')) {
        return;
      }

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'custom-payment-cancelled-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      `;

      // Create modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 16px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      `;

      // Create content
      modal.innerHTML = `
        <div style="margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: #fed7aa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="color: #ea580c; font-size: 32px; font-weight: bold;">✕</div>
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">Payment Cancelled</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">You cancelled the payment. You can try again anytime.</p>
        </div>
        <button id="redirect-home-cancelled-btn" style="
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.2s;
        ">Redirect to Home</button>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Add click handler for button
      const redirectBtn = document.getElementById('redirect-home-cancelled-btn');
      if (redirectBtn) {
        redirectBtn.addEventListener('click', () => {
          overlay.remove();
          onRedirect();
        });

        // Add hover effect
        redirectBtn.addEventListener('mouseenter', () => {
          redirectBtn.style.backgroundColor = '#2563eb';
        });
        redirectBtn.addEventListener('mouseleave', () => {
          redirectBtn.style.backgroundColor = '#3b82f6';
        });
      }

      // Auto-remove overlay and redirect after 5 seconds
      setTimeout(() => {
        if (document.getElementById('custom-payment-cancelled-overlay')) {
          overlay.remove();
          onRedirect();
        }
      }, 5000);

      console.log('✅ Payment cancelled overlay displayed');
    } catch (error) {
      console.error('Error showing payment cancelled overlay:', error);
      // Fail-safe: redirect anyway
      onRedirect();
    }
  }
}

export default CashFreeService;
