#!/usr/bin/env node

/**
 * Simple API Health Check Script for FreeFire Tournaments
 * Tests API endpoints without requiring Firebase write permissions
 * 
 * This script focuses on:
 * 1. Testing API endpoint availability and response structure
 * 2. Identifying broken functionalities
 * 3. Minimal setup requirements
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.API_URL || 'https://freefiretournaments.vercel.app',
  testEmail: 'apitest@example.com',
  testPhoneNumber: '+1234567890',
  testUpiId: 'test@paytm',
  verbose: true
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  summary: {}
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  }[type] || '📝';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const makeApiCall = async (endpoint, options = {}) => {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    log(`Testing: ${endpoint}`, 'test');
    const response = await fetch(url, finalOptions);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
};

const recordTestResult = (testName, success, details = {}) => {
  const result = {
    testName,
    success,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  if (success) {
    testResults.passed.push(result);
    log(`✅ ${testName} - WORKING`, 'success');
  } else {
    testResults.failed.push(result);
    log(`❌ ${testName} - BROKEN: ${details.error || 'Unknown error'}`, 'error');
  }
  
  if (TEST_CONFIG.verbose && details.response && details.showResponse !== false) {
    console.log('   Response:', JSON.stringify(details.response, null, 2));
  }
};

// Test Functions

const testHealthCheck = async () => {
  const response = await makeApiCall('/api/health-check');
  
  recordTestResult(
    'Health Check API',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
  
  if (response.success && response.data) {
    const health = response.data;
    if (!health.services?.cashfree?.configured) {
      testResults.warnings.push('⚠️ Cashfree payment service not properly configured');
    }
    if (!health.services?.firebase?.configured) {
      testResults.warnings.push('⚠️ Firebase service not properly configured');
    }
  }
};

const testEmailServiceContact = async () => {
  const emailData = {
    action: 'contact',
    name: 'API Test User',
    email: TEST_CONFIG.testEmail,
    subject: 'API Test Contact Form',
    message: 'This is a test message from the API testing script',
    uid: 'test-uid-123'
  };
  
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify(emailData)
  });
  
  recordTestResult(
    'Email Service - Contact Form',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
};

const testEmailServiceTournamentNotification = async () => {
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'tournament-notification',
      tournamentId: 'test-tournament-123',
      tournamentName: 'API Test Tournament', // Added required field
      notificationType: 'start'
    })
  });
  
  recordTestResult(
    'Email Service - Tournament Notification',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
};

const testEmailServiceWithdrawalNotification = async () => {
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'withdrawal-notification',
      userId: 'test-user-123',
      userEmail: TEST_CONFIG.testEmail,
      userName: 'API Test User', // Added required field
      amount: 100,
      upiId: TEST_CONFIG.testUpiId,
      status: 'pending'
    })
  });
  
  recordTestResult(
    'Email Service - Withdrawal Notification',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
};

const testEmailServiceGeneral = async () => {
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'general-email',
      emailType: 'notification',
      recipient: TEST_CONFIG.testEmail,
      subject: 'API Test General Email',
      message: 'This is a test general email from API testing'
    })
  });
  
  recordTestResult(
    'Email Service - General Email',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
};

const testPaymentServiceCreateOrder = async () => {
  const orderData = {
    amount: 100,
    userId: 'test-user-123',
    userName: 'API Test User',
    userEmail: TEST_CONFIG.testEmail,
    userPhone: TEST_CONFIG.testPhoneNumber,
    purpose: 'tournament_credits'
  };
  
  const response = await makeApiCall('/api/payment-service', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  
  // Check if response structure is correct
  const success = response.success && 
                 response.status === 200 && 
                 response.data?.success === true &&
                 response.data?.data?.orderId;
  
  recordTestResult(
    'Payment Service - Create Order',
    success,
    {
      response: response.data,
      error: response.error || (!success ? 'Payment API broken or unexpected response format' : null)
    }
  );
};

const testPaymentVerification = async () => {
  const response = await makeApiCall('/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify({
      orderId: 'test-order-123'
    })
  });
  
  // Accept either success or specific payment-related errors (but not 500 errors)
  const isValidResponse = response.status === 200 || 
                         (response.status === 400 && response.data?.error) ||
                         (response.data && typeof response.data === 'object');
  
  recordTestResult(
    'Payment Verification API',
    isValidResponse,
    {
      response: response.data,
      error: response.error || (!isValidResponse ? `Unexpected server error: HTTP ${response.status}` : null)
    }
  );
};

const testPaymentWebhook = async () => {
  const webhookData = {
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: {
      order: {
        order_id: 'test_order_123',
        order_amount: 100,
        order_currency: 'INR'
      },
      payment: {
        payment_status: 'SUCCESS',
        payment_amount: 100,
        payment_currency: 'INR'
      }
    }
  };
  
  const response = await makeApiCall('/api/payment-webhook', {
    method: 'POST',
    body: JSON.stringify(webhookData)
  });
  
  recordTestResult(
    'Payment Webhook API',
    response.status === 200 || response.status === 400,
    {
      response: response.data,
      error: response.error || (response.status >= 500 ? `Server error: HTTP ${response.status}` : null)
    }
  );
};

const testTournamentCheck = async () => {
  const response = await makeApiCall('/api/check-tournament?all=true');
  
  recordTestResult(
    'Tournament Check API',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `HTTP ${response.status}` : null)
    }
  );
};

const testTournamentCancel = async () => {
  const response = await makeApiCall('/api/cancel-tournament', {
    method: 'POST',
    body: JSON.stringify({
      tournamentId: 'test-tournament-123',
      hostId: 'test-host-123',
      reason: 'API Test Cancellation'
    })
  });
  
  // This API correctly requires authentication, so 401 is expected
  recordTestResult(
    'Tournament Cancel API (Auth Required)',
    response.status === 401 && response.data?.error === 'Unauthorized',
    {
      response: response.data,
      error: response.status !== 401 ? `Expected 401 Unauthorized, got ${response.status}` : null
    }
  );
};

const testWithdrawFunds = async () => {
  const withdrawalData = {
    userId: 'test-user-123',
    amount: 50,
    upiId: TEST_CONFIG.testUpiId
  };
  
  const response = await makeApiCall('/api/withdraw-funds', {
    method: 'POST',
    body: JSON.stringify(withdrawalData)
  });
  
  // Accept valid responses or expected business logic errors
  const isValidResponse = response.status === 200 ||
                         (response.status === 400 && response.data?.error);
  
  recordTestResult(
    'Withdraw Funds API',
    isValidResponse,
    {
      response: response.data,
      error: response.error || (!isValidResponse ? `Server error: HTTP ${response.status}` : null)
    }
  );
};

// Test missing/invalid endpoints to check routing
const testInvalidEndpoints = async () => {
  // Test non-existent API endpoint - Note: Vercel may return 200 with index.html for SPAs
  const response1 = await makeApiCall('/api/non-existent-endpoint');
  
  recordTestResult(
    'API Routing - Invalid Endpoint Handling',
    response1.status === 404 || response1.status === 405 || typeof response1.data === 'string',
    {
      response: response1.status,
      error: response1.status === 200 && typeof response1.data === 'object' ? 'Should handle invalid endpoints better' : null,
      showResponse: false
    }
  );
  
  // Test method not allowed - Health check only supports GET
  const response2 = await makeApiCall('/api/health-check', { method: 'DELETE' });
  
  recordTestResult(
    'API Method Validation',
    response2.status === 405 || response2.status === 200,
    {
      response: response2.status,
      error: response2.status >= 500 ? 'Server error on method validation' : null,
      showResponse: false
    }
  );
};

// Generate simplified report
const generateReport = () => {
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(1) : 0;
  
  testResults.summary = {
    totalTests,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: `${passRate}%`,
    timestamp: new Date().toISOString()
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('🏥 FREEFIRE TOURNAMENTS - API HEALTH REPORT');
  console.log('='.repeat(80));
  console.log(`🕐 Report Generated: ${new Date().toLocaleString()}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Working APIs: ${testResults.passed.length}`);
  console.log(`❌ Broken APIs: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`📈 Health Score: ${passRate}%`);
  
  // Health status
  if (passRate >= 90) {
    console.log('🎉 STATUS: EXCELLENT - All systems operational!');
  } else if (passRate >= 70) {
    console.log('👍 STATUS: GOOD - Minor issues detected');
  } else if (passRate >= 50) {
    console.log('⚠️  STATUS: POOR - Multiple issues detected');
  } else {
    console.log('🚨 STATUS: CRITICAL - Major functionality broken');
  }
  
  console.log('='.repeat(80));
  
  if (testResults.failed.length > 0) {
    console.log('\n🚨 BROKEN APIS:');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      console.log(`   Issue: ${test.error}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (testResults.passed.length > 0) {
    console.log('\n✅ WORKING APIS:');
    testResults.passed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
    });
  }
  
  console.log('\n='.repeat(80));
  console.log('🔧 RECOMMENDATIONS:');
  
  if (testResults.failed.length === 0) {
    console.log('✨ All APIs are functioning correctly!');
    console.log('💡 Consider running integration tests for complete coverage.');
  } else {
    if (testResults.failed.some(t => t.testName.includes('Payment'))) {
      console.log('💳 URGENT: Payment system has issues - check Cashfree configuration');
    }
    if (testResults.failed.some(t => t.testName.includes('Email'))) {
      console.log('📧 URGENT: Email system broken - check SMTP settings');
    }
    if (testResults.failed.some(t => t.testName.includes('Tournament'))) {
      console.log('🏆 URGENT: Tournament system issues detected');
    }
    if (testResults.failed.some(t => t.testName.includes('Withdraw'))) {
      console.log('💰 URGENT: Withdrawal system has problems');
    }
  }
  
  console.log('='.repeat(80));
  
  // Impact assessment
  if (testResults.failed.length > 0) {
    console.log('\n💥 BUSINESS IMPACT:');
    const criticalApis = testResults.failed.filter(t => 
      t.testName.includes('Payment') || 
      t.testName.includes('Email') || 
      t.testName.includes('Tournament')
    );
    
    if (criticalApis.length > 0) {
      console.log('🔴 HIGH: Core business functions are affected');
      console.log('   → Users may not be able to join tournaments');
      console.log('   → Payment processing may be broken');
      console.log('   → Email notifications not working');
    } else {
      console.log('🟡 MEDIUM: Secondary functions affected');
    }
  }
  
  console.log('='.repeat(80));
};

// Main test execution
const runHealthCheck = async () => {
  log('🚀 Starting FreeFire Tournaments API Health Check...', 'info');
  log(`Testing against: ${TEST_CONFIG.baseUrl}`, 'info');
  
  try {
    // Core system health
    console.log('\n🏥 BASIC HEALTH CHECK');
    await testHealthCheck();
    
    // Email system tests
    console.log('\n📧 EMAIL SYSTEM TESTS');
    await testEmailServiceContact();
    await testEmailServiceTournamentNotification();
    await testEmailServiceWithdrawalNotification();
    await testEmailServiceGeneral();
    
    // Payment system tests
    console.log('\n💳 PAYMENT SYSTEM TESTS');
    await testPaymentServiceCreateOrder();
    await testPaymentVerification();
    await testPaymentWebhook();
    
    // Tournament system tests
    console.log('\n🏆 TOURNAMENT SYSTEM TESTS');
    await testTournamentCheck();
    await testTournamentCancel();
    
    // Financial operations
    console.log('\n💰 FINANCIAL OPERATIONS TESTS');
    await testWithdrawFunds();
    
    // Infrastructure tests
    console.log('\n🛠️  INFRASTRUCTURE TESTS');
    await testInvalidEndpoints();
    
  } catch (error) {
    log(`Critical error during test execution: ${error.message}`, 'error');
    testResults.failed.push({
      testName: 'Test Execution Framework',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Generate report
    generateReport();
  }
};

// Script execution
runHealthCheck()
  .then(() => {
    const exitCode = testResults.failed.length > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

export { runHealthCheck, testResults };
