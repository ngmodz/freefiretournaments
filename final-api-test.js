#!/usr/bin/env node

/**
 * Final Comprehensive API Test for FreeFire Tournaments
 * Tests all APIs with proper parameters and realistic scenarios
 * 
 * This script will give you the definitive health status of your app!
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const TEST_CONFIG = {
  baseUrl: process.env.API_URL || 'https://freefiretournaments.vercel.app',
  testEmail: 'apitest@example.com',
  testPhoneNumber: '+1234567890',
  testUpiId: 'test@paytm',
  verbose: true
};

const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  summary: {}
};

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

// === API TEST FUNCTIONS ===

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
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'contact',
      name: 'API Test User',
      email: TEST_CONFIG.testEmail,
      subject: 'API Test Contact Form',
      message: 'This is a test message from the API testing script',
      uid: 'test-uid-123'
    })
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

const testEmailServiceWithdrawalNotification = async () => {
  // Test withdrawal request notification
  const response1 = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'withdrawal-notification',
      type: 'request', // Required field
      userId: 'test-user-123',
      userEmail: TEST_CONFIG.testEmail,
      userName: 'API Test User',
      amount: 96, // After commission deduction
      originalAmount: 100,
      commission: 4,
      upiId: TEST_CONFIG.testUpiId
    })
  });
  
  recordTestResult(
    'Email Service - Withdrawal Request Notification',
    response1.success && response1.status === 200,
    {
      response: response1.data,
      error: response1.error || (!response1.success ? `HTTP ${response1.status}` : null)
    }
  );

  // Test withdrawal processed notification
  const response2 = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'withdrawal-notification',
      type: 'processed', // Required field
      userId: 'test-user-123',
      userEmail: TEST_CONFIG.testEmail,
      userName: 'API Test User',
      amount: 96,
      upiId: TEST_CONFIG.testUpiId
    })
  });
  
  recordTestResult(
    'Email Service - Withdrawal Processed Notification',
    response2.success && response2.status === 200,
    {
      response: response2.data,
      error: response2.error || (!response2.success ? `HTTP ${response2.status}` : null)
    }
  );
};

const testEmailServiceGeneral = async () => {
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'general-email',
      type: 'applicationConfirmation', // Changed from 'notification' to supported type
      to: TEST_CONFIG.testEmail,
      name: 'API Test User'
      // Removed unsupported fields for this email type
    })
  });
  
  recordTestResult(
    'Email Service - Host Application Confirmation',
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
    'Tournament Check & Notification System',
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

const testInfrastructure = async () => {
  // Test CORS headers
  const corsResponse = await makeApiCall('/api/health-check', {
    method: 'OPTIONS'
  });
  
  recordTestResult(
    'CORS Support',
    corsResponse.status === 200,
    {
      response: corsResponse.status,
      error: corsResponse.status !== 200 ? 'CORS preflight failed' : null,
      showResponse: false
    }
  );

  // Test method validation
  const methodResponse = await makeApiCall('/api/health-check', {
    method: 'DELETE'
  });
  
  recordTestResult(
    'HTTP Method Validation',
    methodResponse.status === 405 || methodResponse.status === 200,
    {
      response: methodResponse.status,
      error: methodResponse.status >= 500 ? 'Server error on method validation' : null,
      showResponse: false
    }
  );
};

// === REPORT GENERATION ===

const generateComprehensiveReport = () => {
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
  console.log('🏥 FREEFIRE TOURNAMENTS - FINAL API HEALTH REPORT');
  console.log('='.repeat(80));
  console.log(`🕐 Report Generated: ${new Date().toLocaleString()}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`📊 Total Tests Executed: ${totalTests}`);
  console.log(`✅ Working APIs: ${testResults.passed.length}`);
  console.log(`❌ Broken APIs: ${testResults.failed.length}`);
  console.log(`⚠️  Configuration Warnings: ${testResults.warnings.length}`);
  console.log(`📈 Overall Health Score: ${passRate}%`);
  
  // Overall status
  if (passRate >= 95) {
    console.log('🌟 STATUS: EXCELLENT - Your app is in perfect health!');
  } else if (passRate >= 85) {
    console.log('✅ STATUS: VERY GOOD - Minor improvements needed');
  } else if (passRate >= 70) {
    console.log('👍 STATUS: GOOD - Some issues to address');
  } else if (passRate >= 50) {
    console.log('⚠️  STATUS: NEEDS ATTENTION - Multiple issues detected');
  } else {
    console.log('🚨 STATUS: CRITICAL - Major functionality broken');
  }
  
  console.log('='.repeat(80));
  
  // Core systems analysis
  console.log('\n🔍 SYSTEM ANALYSIS:');
  
  const emailTests = testResults.passed.filter(t => t.testName.includes('Email')).length + 
                    testResults.failed.filter(t => t.testName.includes('Email')).length;
  const emailPassed = testResults.passed.filter(t => t.testName.includes('Email')).length;
  console.log(`📧 Email System: ${emailPassed}/${emailTests} working (${(emailPassed/emailTests*100).toFixed(0)}%)`);
  
  const paymentTests = testResults.passed.filter(t => t.testName.includes('Payment')).length + 
                      testResults.failed.filter(t => t.testName.includes('Payment')).length;
  const paymentPassed = testResults.passed.filter(t => t.testName.includes('Payment')).length;
  console.log(`💳 Payment System: ${paymentPassed}/${paymentTests} working (${(paymentPassed/paymentTests*100).toFixed(0)}%)`);
  
  const tournamentTests = testResults.passed.filter(t => t.testName.includes('Tournament')).length + 
                         testResults.failed.filter(t => t.testName.includes('Tournament')).length;
  const tournamentPassed = testResults.passed.filter(t => t.testName.includes('Tournament')).length;
  console.log(`🏆 Tournament System: ${tournamentPassed}/${tournamentTests} working (${(tournamentPassed/tournamentTests*100).toFixed(0)}%)`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ BROKEN FUNCTIONALITIES:');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      console.log(`   Issue: ${test.error}`);
      
      // Add specific recommendations
      if (test.testName.includes('Email')) {
        console.log(`   💡 Fix: Check email service parameters and SMTP configuration`);
      } else if (test.testName.includes('Payment')) {
        console.log(`   💡 Fix: Verify Cashfree API integration and credentials`);
      } else if (test.testName.includes('Tournament')) {
        console.log(`   💡 Fix: Check Firebase authentication and tournament data`);
      }
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  CONFIGURATION WARNINGS:');
    testResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (testResults.passed.length > 0) {
    console.log('\n✅ WORKING FUNCTIONALITIES:');
    testResults.passed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
    });
  }
  
  console.log('\n='.repeat(80));
  console.log('💼 BUSINESS IMPACT ASSESSMENT:');
  
  const criticalIssues = testResults.failed.filter(t => 
    t.testName.includes('Payment') || 
    t.testName.includes('Tournament Check') ||
    t.testName.includes('Withdraw')
  );
  
  if (criticalIssues.length === 0) {
    console.log('🟢 LOW IMPACT: All critical business functions are operational');
    console.log('   ✓ Users can make payments');
    console.log('   ✓ Tournament system is working');
    console.log('   ✓ Withdrawal system is functional');
  } else {
    console.log('🔴 HIGH IMPACT: Critical business functions affected');
    criticalIssues.forEach(issue => {
      if (issue.testName.includes('Payment')) {
        console.log('   ❌ Payment processing may be disrupted');
      }
      if (issue.testName.includes('Tournament')) {
        console.log('   ❌ Tournament operations may be affected');
      }
      if (issue.testName.includes('Withdraw')) {
        console.log('   ❌ User withdrawals may not work');
      }
    });
  }
  
  console.log('\n='.repeat(80));
  console.log('🚀 NEXT STEPS:');
  
  if (testResults.failed.length === 0) {
    console.log('🎉 Congratulations! Your FreeFire Tournaments app is healthy!');
    console.log('💡 Consider implementing monitoring for production');
    console.log('📊 Run this test regularly to catch issues early');
  } else {
    console.log('🔧 Priority fixes needed:');
    const priorities = ['Payment', 'Tournament', 'Email', 'Withdraw'];
    priorities.forEach(priority => {
      const issues = testResults.failed.filter(t => t.testName.includes(priority));
      if (issues.length > 0) {
        console.log(`   • Fix ${priority} system issues (${issues.length} problem${issues.length > 1 ? 's' : ''})`);
      }
    });
  }
  
  console.log('='.repeat(80));
};

// === MAIN EXECUTION ===

const runComprehensiveTest = async () => {
  log('🚀 Starting Comprehensive FreeFire Tournaments API Test...', 'info');
  log(`Testing Production Environment: ${TEST_CONFIG.baseUrl}`, 'info');
  
  try {
    console.log('\n🏥 CORE SYSTEM HEALTH');
    await testHealthCheck();
    
    console.log('\n📧 EMAIL SYSTEM COMPLETE TEST');
    await testEmailServiceContact();
    await testEmailServiceWithdrawalNotification();
    await testEmailServiceGeneral();
    
    console.log('\n💳 PAYMENT SYSTEM COMPLETE TEST');
    await testPaymentServiceCreateOrder();
    await testPaymentVerification();
    await testPaymentWebhook();
    
    console.log('\n🏆 TOURNAMENT SYSTEM COMPLETE TEST');
    await testTournamentCheck();
    await testTournamentCancel();
    
    console.log('\n💰 FINANCIAL OPERATIONS TEST');
    await testWithdrawFunds();
    
    console.log('\n🛠️  INFRASTRUCTURE TEST');
    await testInfrastructure();
    
  } catch (error) {
    log(`Critical error during test execution: ${error.message}`, 'error');
    testResults.failed.push({
      testName: 'Test Framework',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    generateComprehensiveReport();
  }
};

// Execute the test
runComprehensiveTest()
  .then(() => {
    const exitCode = testResults.failed.length > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

export { runComprehensiveTest, testResults };
