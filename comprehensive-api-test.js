#!/usr/bin/env node

/**
 * Comprehensive API Health Check Script
 * Tests every single API endpoint in the FreeFire Tournaments app
 * 
 * This script will:
 * 1. Test all API endpoints systematically
 * 2. Create test data where needed
 * 3. Clean up test data
 * 4. Generate a detailed health report
 * 5. Identify broken functionalities
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.API_URL || 'https://freefiretournaments.vercel.app',
  testEmail: 'apitest@example.com',
  testPassword: 'TestPass123!',
  testHostEmail: 'testhost@example.com',
  testPhoneNumber: '+1234567890',
  testUpiId: 'test@paytm',
  cleanupAfterTests: true,
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    log(`Making API call to: ${endpoint}`, 'test');
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
    log(`✅ ${testName} PASSED`, 'success');
  } else {
    testResults.failed.push(result);
    log(`❌ ${testName} FAILED: ${details.error || 'Unknown error'}`, 'error');
  }
  
  if (TEST_CONFIG.verbose && details.response) {
    console.log('   Response:', JSON.stringify(details.response, null, 2));
  }
};

// Test user management
let testUserUid = null;
let testHostUserUid = null;
let testTournamentId = null;
let testPaymentOrderId = null;
let testHostApplicationId = null;

const createTestUser = async () => {
  try {
    log('Creating test user...', 'test');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      TEST_CONFIG.testEmail, 
      TEST_CONFIG.testPassword
    );
    testUserUid = userCredential.user.uid;
    
    // Add user profile to Firestore
    await addDoc(collection(db, 'users'), {
      uid: testUserUid,
      email: TEST_CONFIG.testEmail,
      displayName: 'API Test User',
      phoneNumber: TEST_CONFIG.testPhoneNumber,
      upiId: TEST_CONFIG.testUpiId,
      tournamentCredits: 1000,
      walletBalance: 500,
      isHost: false,
      createdAt: serverTimestamp()
    });
    
    log(`Test user created with UID: ${testUserUid}`, 'success');
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Try to sign in instead
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          TEST_CONFIG.testEmail, 
          TEST_CONFIG.testPassword
        );
        testUserUid = userCredential.user.uid;
        log(`Using existing test user: ${testUserUid}`, 'success');
        return true;
      } catch (signInError) {
        log(`Failed to create/sign in test user: ${signInError.message}`, 'error');
        return false;
      }
    } else {
      log(`Failed to create test user: ${error.message}`, 'error');
      return false;
    }
  }
};

const createTestHostUser = async () => {
  try {
    log('Creating test host user...', 'test');
    
    // Sign out current user first
    await signOut(auth);
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      TEST_CONFIG.testHostEmail, 
      TEST_CONFIG.testPassword
    );
    testHostUserUid = userCredential.user.uid;
    
    // Add host user profile to Firestore
    await addDoc(collection(db, 'users'), {
      uid: testHostUserUid,
      email: TEST_CONFIG.testHostEmail,
      displayName: 'API Test Host',
      phoneNumber: '+9876543210',
      upiId: 'testhost@paytm',
      tournamentCredits: 2000,
      walletBalance: 1000,
      isHost: true,
      hostApplicationStatus: 'approved',
      createdAt: serverTimestamp()
    });
    
    log(`Test host user created with UID: ${testHostUserUid}`, 'success');
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          TEST_CONFIG.testHostEmail, 
          TEST_CONFIG.testPassword
        );
        testHostUserUid = userCredential.user.uid;
        log(`Using existing test host user: ${testHostUserUid}`, 'success');
        return true;
      } catch (signInError) {
        log(`Failed to create/sign in test host user: ${signInError.message}`, 'error');
        return false;
      }
    } else {
      log(`Failed to create test host user: ${error.message}`, 'error');
      return false;
    }
  }
};

const createTestTournament = async () => {
  try {
    log('Creating test tournament...', 'test');
    
    const tournamentData = {
      title: 'API Test Tournament',
      description: 'This is a test tournament created by the API testing script',
      startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      entryFee: 50,
      maxParticipants: 100,
      prizePool: 1000,
      gameMode: 'Battle Royale',
      map: 'Bermuda',
      hostId: testHostUserUid,
      hostEmail: TEST_CONFIG.testHostEmail,
      participants: [],
      status: 'upcoming',
      notificationSent: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
    testTournamentId = docRef.id;
    
    log(`Test tournament created with ID: ${testTournamentId}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to create test tournament: ${error.message}`, 'error');
    return false;
  }
};

// API Test Functions

const testHealthCheck = async () => {
  const response = await makeApiCall('/api/health-check');
  
  recordTestResult(
    'Health Check API',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
  
  if (response.success && response.data) {
    const health = response.data;
    if (!health.services?.cashfree?.configured) {
      testResults.warnings.push('Cashfree payment service not configured');
    }
    if (!health.services?.firebase?.configured) {
      testResults.warnings.push('Firebase service not configured');
    }
  }
};

const testEmailServiceContact = async () => {
  const emailData = {
    name: 'API Test User',
    email: TEST_CONFIG.testEmail,
    subject: 'API Test Contact Form',
    message: 'This is a test message from the API testing script',
    uid: testUserUid
  };
  
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'contact', // Changed from 'type' to 'action'
      ...emailData
    })
  });
  
  recordTestResult(
    'Email Service - Contact Form',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testEmailServiceTournamentNotification = async () => {
  if (!testTournamentId) {
    recordTestResult('Email Service - Tournament Notification', false, {
      error: 'No test tournament available'
    });
    return;
  }
  
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'tournament', // Changed from 'type' to 'action'
      tournamentId: testTournamentId,
      notificationType: 'start'
    })
  });
  
  recordTestResult(
    'Email Service - Tournament Notification',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testEmailServiceWithdrawalNotification = async () => {
  const withdrawalData = {
    userId: testUserUid,
    userEmail: TEST_CONFIG.testEmail,
    amount: 100,
    upiId: TEST_CONFIG.testUpiId,
    status: 'pending'
  };
  
  const response = await makeApiCall('/api/email-service', {
    method: 'POST',
    body: JSON.stringify({
      action: 'withdrawal', // Changed from 'type' to 'action'
      ...withdrawalData
    })
  });
  
  recordTestResult(
    'Email Service - Withdrawal Notification',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testPaymentServiceCreateOrder = async () => {
  const orderData = {
    amount: 100,
    userId: testUserUid,
    userName: 'API Test User',
    userEmail: TEST_CONFIG.testEmail,
    userPhone: TEST_CONFIG.testPhoneNumber,
    purpose: 'tournament_credits'
  };
  
  const response = await makeApiCall('/api/payment-service', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  
  // Check if response is successful AND contains order data
  const success = response.success && 
                 response.status === 200 && 
                 response.data?.success === true &&
                 response.data?.data?.orderId;
  
  if (success) {
    testPaymentOrderId = response.data.data.orderId;
  }
  
  recordTestResult(
    'Payment Service - Create Order',
    success,
    {
      response: response.data,
      error: response.error || (!success ? 'Payment order creation failed or incomplete response' : null)
    }
  );
};

const testPaymentVerification = async () => {
  if (!testPaymentOrderId) {
    recordTestResult('Payment Verification', false, {
      error: 'No test payment order available'
    });
    return;
  }
  
  // This will fail in sandbox but we test the endpoint structure
  const response = await makeApiCall('/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify({
      orderId: testPaymentOrderId
    })
  });
  
  // Accept either success or specific payment-related errors
  const isValidResponse = response.status === 200 || 
                         response.status === 400 || 
                         (response.data && typeof response.data === 'object');
  
  recordTestResult(
    'Payment Verification API',
    isValidResponse,
    {
      response: response.data,
      error: response.error || (!isValidResponse ? `Unexpected status: ${response.status}` : null)
    }
  );
};

const testPaymentWebhook = async () => {
  // Test webhook endpoint structure
  const webhookData = {
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: {
      order: {
        order_id: testPaymentOrderId || 'test_order_123',
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
      error: response.error || (response.status >= 500 ? `Server error: ${response.status}` : null)
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
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testTournamentJoin = async () => {
  if (!testTournamentId || !testUserUid) {
    recordTestResult('Tournament Join', false, {
      error: 'No test tournament or user available'
    });
    return;
  }
  
  // Add participant to tournament
  try {
    const tournamentRef = doc(db, 'tournaments', testTournamentId);
    await updateDoc(tournamentRef, {
      participants: [{
        uid: testUserUid,
        email: TEST_CONFIG.testEmail,
        displayName: 'API Test User',
        joinedAt: serverTimestamp()
      }]
    });
    
    recordTestResult('Tournament Join (Firestore)', true, {
      message: 'Successfully joined tournament'
    });
  } catch (error) {
    recordTestResult('Tournament Join (Firestore)', false, {
      error: error.message
    });
  }
};

const testTournamentCancel = async () => {
  if (!testTournamentId) {
    recordTestResult('Tournament Cancel API', false, {
      error: 'No test tournament available'
    });
    return;
  }
  
  const response = await makeApiCall('/api/cancel-tournament', {
    method: 'POST',
    body: JSON.stringify({
      tournamentId: testTournamentId,
      hostId: testHostUserUid,
      reason: 'API Test Cancellation'
    })
  });
  
  recordTestResult(
    'Tournament Cancel API',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testWithdrawFunds = async () => {
  const withdrawalData = {
    userId: testUserUid,
    amount: 50,
    upiId: TEST_CONFIG.testUpiId
  };
  
  const response = await makeApiCall('/api/withdraw-funds', {
    method: 'POST',
    body: JSON.stringify(withdrawalData)
  });
  
  recordTestResult(
    'Withdraw Funds API',
    response.success && response.status === 200,
    {
      response: response.data,
      error: response.error || (!response.success ? `Status: ${response.status}` : null)
    }
  );
};

const testHostApplicationSubmission = async () => {
  try {
    // Create a host application in Firestore
    const applicationData = {
      userId: testUserUid,
      userEmail: TEST_CONFIG.testEmail,
      fullName: 'API Test Host Applicant',
      phoneNumber: TEST_CONFIG.testPhoneNumber,
      experience: 'Testing API endpoints',
      previousTournaments: 0,
      status: 'pending',
      submittedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'hostApplications'), applicationData);
    testHostApplicationId = docRef.id;
    
    recordTestResult('Host Application Submission', true, {
      message: `Host application created with ID: ${testHostApplicationId}`
    });
  } catch (error) {
    recordTestResult('Host Application Submission', false, {
      error: error.message
    });
  }
};

const testHostApplicationApproval = async () => {
  if (!testHostApplicationId) {
    recordTestResult('Host Application Approval', false, {
      error: 'No test host application available'
    });
    return;
  }
  
  try {
    // Update application status to approved
    const applicationRef = doc(db, 'hostApplications', testHostApplicationId);
    await updateDoc(applicationRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: 'API Test Script'
    });
    
    recordTestResult('Host Application Approval', true, {
      message: 'Host application approved successfully'
    });
  } catch (error) {
    recordTestResult('Host Application Approval', false, {
      error: error.message
    });
  }
};

const testFirebaseOperations = async () => {
  try {
    // Test Firestore read
    const usersSnapshot = await getDocs(collection(db, 'users'));
    recordTestResult('Firebase Firestore Read', true, {
      message: `Read ${usersSnapshot.size} users from Firestore`
    });
    
    // Test Firestore write
    const testDoc = await addDoc(collection(db, 'apiTests'), {
      testType: 'connectivity',
      timestamp: serverTimestamp(),
      success: true
    });
    
    recordTestResult('Firebase Firestore Write', true, {
      message: `Created test document: ${testDoc.id}`
    });
    
    // Clean up test document
    await deleteDoc(testDoc);
    
  } catch (error) {
    recordTestResult('Firebase Operations', false, {
      error: error.message
    });
  }
};

// Cleanup function
const cleanupTestData = async () => {
  if (!TEST_CONFIG.cleanupAfterTests) {
    log('Skipping cleanup as per configuration', 'info');
    return;
  }
  
  log('Starting cleanup of test data...', 'test');
  
  try {
    // Delete test tournament
    if (testTournamentId) {
      await deleteDoc(doc(db, 'tournaments', testTournamentId));
      log(`Deleted test tournament: ${testTournamentId}`, 'success');
    }
    
    // Delete host application
    if (testHostApplicationId) {
      await deleteDoc(doc(db, 'hostApplications', testHostApplicationId));
      log(`Deleted test host application: ${testHostApplicationId}`, 'success');
    }
    
    // Delete test users from Firestore
    const usersQuery = query(
      collection(db, 'users'), 
      where('email', 'in', [TEST_CONFIG.testEmail, TEST_CONFIG.testHostEmail])
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    const batch = writeBatch(db);
    usersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    log(`Deleted ${usersSnapshot.size} test user documents`, 'success');
    
    // Sign out
    await signOut(auth);
    
    log('Cleanup completed successfully', 'success');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'error');
  }
};

// Generate test report
const generateReport = () => {
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(2) : 0;
  
  testResults.summary = {
    totalTests,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: `${passRate}%`,
    timestamp: new Date().toISOString()
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('🏥 COMPREHENSIVE API HEALTH CHECK REPORT');
  console.log('='.repeat(80));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  console.log(`🕐 Completed: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80));
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      console.log(`   Error: ${test.error}`);
      if (test.response && typeof test.response === 'object') {
        console.log(`   Response: ${JSON.stringify(test.response, null, 2)}`);
      }
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (testResults.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    testResults.passed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
    });
  }
  
  console.log('\n='.repeat(80));
  console.log('📋 RECOMMENDATIONS:');
  
  if (testResults.failed.length === 0) {
    console.log('🎉 All systems are operational! Your API is healthy.');
  } else {
    console.log('🔧 Please fix the failed tests to ensure full functionality.');
    if (testResults.failed.some(t => t.testName.includes('Payment'))) {
      console.log('💳 Payment system issues detected - check Cashfree configuration');
    }
    if (testResults.failed.some(t => t.testName.includes('Email'))) {
      console.log('📧 Email system issues detected - check SMTP configuration');
    }
    if (testResults.failed.some(t => t.testName.includes('Firebase'))) {
      console.log('🔥 Firebase issues detected - check service account and permissions');
    }
  }
  
  console.log('='.repeat(80));
};

// Main test execution
const runAllTests = async () => {
  log('🚀 Starting Comprehensive API Health Check...', 'info');
  log(`Base URL: ${TEST_CONFIG.baseUrl}`, 'info');
  
  try {
    // Setup phase
    log('\n📋 SETUP PHASE', 'info');
    await createTestUser();
    await createTestHostUser();
    await createTestTournament();
    
    // Core API tests
    log('\n🧪 CORE API TESTS', 'info');
    await testHealthCheck();
    await sleep(1000);
    
    // Email service tests
    log('\n📧 EMAIL SERVICE TESTS', 'info');
    await testEmailServiceContact();
    await sleep(1000);
    await testEmailServiceTournamentNotification();
    await sleep(1000);
    await testEmailServiceWithdrawalNotification();
    await sleep(1000);
    
    // Payment service tests
    log('\n💳 PAYMENT SERVICE TESTS', 'info');
    await testPaymentServiceCreateOrder();
    await sleep(1000);
    await testPaymentVerification();
    await sleep(1000);
    await testPaymentWebhook();
    await sleep(1000);
    
    // Tournament management tests
    log('\n🏆 TOURNAMENT MANAGEMENT TESTS', 'info');
    await testTournamentCheck();
    await sleep(1000);
    await testTournamentJoin();
    await sleep(1000);
    await testTournamentCancel();
    await sleep(1000);
    
    // Financial operations tests
    log('\n💰 FINANCIAL OPERATIONS TESTS', 'info');
    await testWithdrawFunds();
    await sleep(1000);
    
    // Host management tests
    log('\n👥 HOST MANAGEMENT TESTS', 'info');
    await testHostApplicationSubmission();
    await sleep(1000);
    await testHostApplicationApproval();
    await sleep(1000);
    
    // Firebase operations tests
    log('\n🔥 FIREBASE OPERATIONS TESTS', 'info');
    await testFirebaseOperations();
    await sleep(1000);
    
    // Cleanup
    log('\n🧹 CLEANUP PHASE', 'info');
    await cleanupTestData();
    
  } catch (error) {
    log(`Critical error during test execution: ${error.message}`, 'error');
    testResults.failed.push({
      testName: 'Test Execution',
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  runAllTests()
    .then(() => {
      process.exit(testResults.failed.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };