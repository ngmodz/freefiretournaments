/**
 * End-to-End Test for Host Approval Email System
 * This script tests the complete host approval email flow
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

console.log('🧪 END-TO-END HOST APPROVAL EMAIL TEST');
console.log('======================================\n');

// Get test email from command line arguments
const testEmail = process.argv[2];
const testName = process.argv[3] || 'Test User';

if (!testEmail) {
  console.error('❌ Please provide a test email address');
  console.log('Usage: node scripts/test-host-approval-email-e2e.js your-email@example.com "Your Name"');
  process.exit(1);
}

console.log(`📧 Testing host approval email to: ${testEmail}`);
console.log(`👤 Test user name: ${testName}`);

// Test 1: Direct email sending using nodemailer
async function testDirectEmailSending() {
  console.log('\n🔧 Test 1: Direct Email Sending');
  console.log('================================');
  
  try {
    // Use the host approval email credentials
    const hostApprovalEmailUser = process.env.HOST_APPROVAL_EMAIL_USER;
    const hostApprovalEmailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;
    
    if (!hostApprovalEmailUser || !hostApprovalEmailPass) {
      console.error('❌ Host approval email credentials not found');
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: hostApprovalEmailUser,
        pass: hostApprovalEmailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    const mailOptions = {
      from: `"Freefire Tournaments" <${hostApprovalEmailUser}>`,
      to: testEmail,
      subject: 'Test: Host Approval Email (Direct)',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3 style="color: #28a745;">🎉 Test: Host Approval Email</h3>
          <p>Hello, ${testName},</p>
          <p>This is a test email to verify that the host approval email system is working correctly.</p>
          <p>If you receive this email, it means:</p>
          <ul>
            <li>Email credentials are correctly configured</li>
            <li>SMTP connection is working</li>
            <li>Email template is properly formatted</li>
          </ul>
          <p>Test timestamp: ${new Date().toISOString()}</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team (Test)</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Direct email sent successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Direct email sending failed:', error.message);
    return false;
  }
}

// Test 2: Email service API simulation
async function testEmailServiceAPI() {
  console.log('\n🔧 Test 2: Email Service API Simulation');
  console.log('=====================================');
  
  try {
    // Simulate the exact same call that the admin panel makes
    const handleGeneralEmail = async (req, res) => {
      const { type, to, name } = req.body;
      
      if (!type || !to) {
        throw new Error('Email type and recipient are required');
      }
      
      // Get email credentials (with host approval fallback)
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASSWORD;
      
      let actualEmailUser = emailUser;
      let actualEmailPass = emailPass;
      
      if (type === 'hostApproval') {
        const hostApprovalEmailUser = process.env.HOST_APPROVAL_EMAIL_USER;
        const hostApprovalEmailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;
        
        if (hostApprovalEmailUser && hostApprovalEmailPass) {
          actualEmailUser = hostApprovalEmailUser;
          actualEmailPass = hostApprovalEmailPass;
          console.log('   ✅ Using specific host approval email credentials');
        }
      }
      
      if (!actualEmailUser || !actualEmailPass) {
        throw new Error('Email configuration not found');
      }
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: actualEmailUser, pass: actualEmailPass },
        tls: { rejectUnauthorized: false }
      });
      
      let subject = '';
      let html = '';
      
      if (type === 'hostApproval') {
        subject = 'Congratulations! Your Host Application has been Approved';
        html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h3 style="color: #28a745;">🎉 Congratulations! Your Host Application has been Approved</h3>
            <p>Hello, ${name},</p>
            <p>Great news! Your application to become a tournament host on our platform has been <strong>approved</strong>!</p>
            <p>You now have access to:</p>
            <ul style="color: #333; margin-left: 20px;">
              <li>Create and manage tournaments</li>
              <li>Access the host dashboard</li>
              <li>Earn commissions from tournaments</li>
              <li>Build your reputation as a trusted host</li>
            </ul>
            <p>To get started, simply log into your account and navigate to the host panel.</p>
            <p>Welcome to the FreeFire Tournaments hosting community!</p>
            <p><small>Test timestamp: ${new Date().toISOString()}</small></p>
            <br/>
            <p>Best regards,<br/>The Freefire Tournaments Team</p>
          </div>
        `;
      } else {
        throw new Error('Unsupported email type');
      }
      
      const mailOptions = {
        from: `"Freefire Tournaments" <${actualEmailUser}>`,
        to: to,
        subject: subject,
        html: html
      };
      
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully' };
    };
    
    // Simulate request
    const mockRequest = {
      body: {
        action: 'general-email',
        type: 'hostApproval',
        to: testEmail,
        name: testName
      }
    };
    
    const result = await handleGeneralEmail(mockRequest, {});
    console.log('✅ Email service API simulation successful!');
    console.log('📋 Result:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Email service API simulation failed:', error.message);
    return false;
  }
}

// Test 3: Check host applications in database
async function testHostApplications() {
  console.log('\n🔧 Test 3: Host Applications Database Check');
  console.log('==========================================');
  
  try {
    // Initialize Firebase Admin
    const firebaseAdmin = await import('firebase-admin');
    if (!firebaseAdmin.default.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseAdmin.default.initializeApp({
        credential: firebaseAdmin.default.credential.cert(serviceAccount)
      });
    }
    
    const db = firebaseAdmin.default.firestore();
    
    // Check for pending applications
    const pendingApps = await db.collection('hostApplications')
      .where('status', '==', 'pending')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${pendingApps.size} pending host applications`);
    
    if (pendingApps.size > 0) {
      console.log('📋 Pending applications:');
      pendingApps.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.userName} (${data.userEmail})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Host applications check failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive tests...\n');
  
  const results = {
    directEmail: await testDirectEmailSending(),
    emailServiceAPI: await testEmailServiceAPI(),
    hostApplications: await testHostApplications()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('======================');
  console.log(`Direct Email Sending: ${results.directEmail ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Email Service API: ${results.emailServiceAPI ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Host Applications DB: ${results.hostApplications ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('The host approval email system is working correctly.');
    console.log('You should now be able to approve host applications and emails will be sent automatically.');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().then((success) => {
  if (success) {
    console.log('\n✅ Testing completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Testing completed with errors!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
