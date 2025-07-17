/**
 * Quick test script to verify the email endpoint is working
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const testEmail = process.argv[2];
const testName = process.argv[3] || 'Test User';

if (!testEmail) {
  console.error('❌ Please provide a test email address');
  console.log('Usage: node scripts/test-email-endpoint.js your-email@example.com "Your Name"');
  process.exit(1);
}

console.log('📧 Testing email endpoint...');
console.log(`Email: ${testEmail}`);
console.log(`Name: ${testName}`);

// Test the email endpoint
async function testEmailEndpoint() {
  try {
    const response = await fetch('http://localhost:8084/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'general-email',
        type: 'hostApproval',
        to: testEmail,
        name: testName,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ Email endpoint test successful!');
    } else {
      console.log('❌ Email endpoint test failed!');
    }
  } catch (error) {
    console.error('❌ Error testing email endpoint:', error.message);
  }
}

testEmailEndpoint();
