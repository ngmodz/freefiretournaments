// Test email sending functionality
import nodemailer from 'nodemailer';

// Email configuration - replace with your actual credentials
const emailUser = process.env.EMAIL_USER || 'your_email@gmail.com';
const emailPass = process.env.EMAIL_PASSWORD || 'your_app_password';

async function testEmailSending() {
  console.log(`Testing email sending with user: ${emailUser}`);
  
  // Configure email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false // Ignore certificate issues
    }
  });
  
  // Prepare email content
  const mailOptions = {
    from: `"Test Email" <${emailUser}>`,
    to: emailUser, // Send to yourself for testing
    subject: `🧪 Test Email from Tournament System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6200EA;">Test Email</h1>
        </div>
        
        <p>Hello,</p>
        
        <p>This is a test email to verify that the notification system is working correctly.</p>
        
        <p>If you received this email, it means your email configuration is correct!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #666;">This is a test email. Please do not reply.</p>
        </div>
      </div>
    `
  };
  
  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email:`, error);
    return { success: false, error: error.message };
  }
}

// Run the test
testEmailSending()
  .then(result => {
    console.log('Test completed:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 