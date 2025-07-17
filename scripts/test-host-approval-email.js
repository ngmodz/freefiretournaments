/**
 * Test Script for Host Approval Email Functionality
 * This script tests the host approval email by simulating the API call
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

console.log('📧 HOST APPROVAL EMAIL TEST SCRIPT');
console.log('===================================\n');

// Get test email from command line arguments
const testEmail = process.argv[2];
const testName = process.argv[3] || 'Test User';

if (!testEmail) {
  console.error('❌ Please provide a test email address');
  console.log('Usage: node scripts/test-host-approval-email.js your-email@example.com "Your Name"');
  process.exit(1);
}

console.log(`📤 Testing host approval email to: ${testEmail}`);
console.log(`👤 Test user name: ${testName}`);

// Test the email service API
async function testHostApprovalEmail() {
  try {
    console.log('\n🔧 Testing email service API...');
    
    // Import the email service handler directly
    const emailServicePath = path.resolve(__dirname, '..', 'api', 'email-service.js');
    const { default: emailHandler } = await import(emailServicePath);
    
    // Create a mock request and response
    const mockRequest = {
      method: 'POST',
      body: {
        action: 'general-email',
        type: 'hostApproval',
        to: testEmail,
        name: testName
      }
    };
    
    const mockResponse = {
      headers: {},
      statusCode: 200,
      responseData: null,
      
      setHeader: function(key, value) {
        this.headers[key] = value;
      },
      
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      
      json: function(data) {
        this.responseData = data;
        return this;
      },
      
      end: function() {
        return this;
      }
    };
    
    console.log('📨 Sending host approval email...');
    
    // Call the email handler
    await emailHandler(mockRequest, mockResponse);
    
    if (mockResponse.statusCode === 200) {
      console.log('✅ Host approval email sent successfully!');
      console.log('📋 Response:', mockResponse.responseData);
    } else {
      console.error('❌ Failed to send host approval email');
      console.error('📋 Response:', mockResponse.responseData);
    }
    
  } catch (error) {
    console.error('❌ Error testing host approval email:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHostApprovalEmail().then(() => {
  console.log('\n✅ Test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
