// API endpoint to test email sending
import nodemailer from 'nodemailer';
import { getEmailConfig, debugEnvironment } from './firebase-config-helper.js';

export default async function handler(req, res) {
  try {
    // Get environment details for debugging
    const envDetails = debugEnvironment();
    console.log('Environment details:', envDetails);
    
    // Get email config
    const emailConfig = getEmailConfig();
    const emailUser = emailConfig.user;
    const emailPass = emailConfig.pass;
    
    console.log('Email config available:', {
      user: !!emailUser,
      pass: !!emailPass
    });
    
    if (!emailUser || !emailPass) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email configuration missing. Please check environment variables.' 
      });
    }
    
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
      
      return res.status(200).json({ 
        success: true, 
        messageId: info.messageId,
        sentTo: emailUser
      });
    } catch (error) {
      console.error(`❌ Error sending email:`, error);
      
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.toString()
      });
    }
  } catch (error) {
    console.error('Error in test-email endpoint:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
} 