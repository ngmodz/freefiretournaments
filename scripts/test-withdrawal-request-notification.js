import nodemailer from 'nodemailer';

async function testWithdrawalRequestNotification() {
  console.log('===== WITHDRAWAL REQUEST NOTIFICATION TEST =====');
  console.log('Environment variables:');
  console.log(`WITHDRAWAL_EMAIL_USER: ${process.env.WITHDRAWAL_EMAIL_USER || 'NOT SET'}`);
  console.log(`WITHDRAWAL_EMAIL_PASSWORD length: ${process.env.WITHDRAWAL_EMAIL_PASSWORD ? process.env.WITHDRAWAL_EMAIL_PASSWORD.length : 'NOT SET'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET'}`);
  
  // Test the API endpoint
  try {
    console.log('\nTesting withdrawal request notification API...');
    const apiUrl = process.env.APP_URL || 'http://localhost:8083';
    const testData = {
      userId: 'test-user-id',
      userEmail: process.env.TEST_EMAIL || 'test@example.com',
      userName: 'Test User',
      amount: 500,
      upiId: 'test@upi',
      transactionId: 'test-transaction-123'
    };
    
    console.log('Sending test request to:', `${apiUrl}/api/send-withdrawal-request-notification`);
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${apiUrl}/api/send-withdrawal-request-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ API test failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
  
  // Test email configuration directly
  try {
    console.log('\nTesting email configuration directly...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.WITHDRAWAL_EMAIL_USER || process.env.EMAIL_USER,
        pass: process.env.WITHDRAWAL_EMAIL_PASSWORD || process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Email configuration test successful!');
    
    // Send a test email
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    if (testEmail !== 'test@example.com') {
      console.log(`\nSending test email to ${testEmail}...`);
      
      const mailOptions = {
        from: `"Freefire Tournaments" <${process.env.WITHDRAWAL_EMAIL_USER || process.env.EMAIL_USER}>`,
        to: testEmail,
        subject: 'Test: Withdrawal Request Notification',
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 15px;">
            <h1>Test Email</h1>
            <p>This is a test email to verify the withdrawal request notification system is working.</p>
            <p>If you receive this, the email configuration is correct!</p>
          </div>
        `,
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', info.messageId);
    } else {
      console.log('\nSkipping test email (TEST_EMAIL not set)');
    }
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
  }
}

// Run the test
testWithdrawalRequestNotification().catch(console.error); 