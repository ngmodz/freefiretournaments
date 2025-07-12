import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig } from './firebase-config-helper.js';

// Use withdrawal-specific email credentials
const emailConfig = {
  user: process.env.WITHDRAWAL_EMAIL_USER,
  pass: process.env.WITHDRAWAL_EMAIL_PASSWORD
};

// Log the loaded email config to the backend console for debugging
console.log("Attempting to use withdrawal email config:", {
  user: emailConfig.user ? 'OK' : 'MISSING',
  pass: emailConfig.pass ? 'OK' : 'MISSING'
});

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log(`[send-withdrawal-notification] Attempting to send email from: ${process.env.WITHDRAWAL_EMAIL_USER}`);

export default async function handler(req, res) {
  try {
    // Log all environment variables related to email
    console.log('DEBUGGING EMAIL CONFIGURATION:');
    console.log(`WITHDRAWAL_EMAIL_USER: ${process.env.WITHDRAWAL_EMAIL_USER || 'NOT SET'}`);
    console.log(`WITHDRAWAL_EMAIL_PASSWORD length: ${process.env.WITHDRAWAL_EMAIL_PASSWORD ? process.env.WITHDRAWAL_EMAIL_PASSWORD.length : 'NOT SET'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET'}`);
    
    const { userId, userEmail, userName, amount, upiId, remainingBalance } = req.body;
    
    if (!userId || !userEmail || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subject = `Withdrawal Confirmation - ₹${amount} Processed`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4CAF50;">Withdrawal Confirmation</h2>
        </div>
        <p>Dear ${userName || 'User'},</p>
        <p>We're pleased to confirm that your withdrawal request has been processed successfully.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p><strong>UPI ID:</strong> ${upiId || 'Not provided'}</p>
          <p><strong>Remaining Balance:</strong> ₹${remainingBalance || '0'}</p>
        </div>
        <p>The funds should reflect in your account within the next 24 hours.</p>
        <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // First try with WITHDRAWAL_EMAIL credentials
    let transporter;
    let emailUser;
    let emailPass;
    
    if (process.env.WITHDRAWAL_EMAIL_USER && process.env.WITHDRAWAL_EMAIL_PASSWORD) {
      emailUser = process.env.WITHDRAWAL_EMAIL_USER;
      emailPass = process.env.WITHDRAWAL_EMAIL_PASSWORD;
      console.log('Using WITHDRAWAL_EMAIL credentials');
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      emailUser = process.env.EMAIL_USER;
      emailPass = process.env.EMAIL_PASSWORD;
      console.log('Using fallback EMAIL credentials');
    } else {
      return res.status(500).json({ error: 'No email credentials found in environment variables' });
    }
    
    console.log(`Creating transporter with user: ${emailUser}`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      debug: true,
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    try {
      console.log('Verifying connection...');
      await transporter.verify();
      console.log('Connection verified successfully');
    } catch (verifyError) {
      console.error('Connection verification failed:', verifyError);
      return res.status(500).json({ error: `SMTP connection failed: ${verifyError.message}` });
    }

    // Send the email
    const mailOptions = {
      from: `"Lovable" <${emailUser}>`,
      to: userEmail,
      subject: subject,
      html: htmlContent,
    };

    console.log('Sending email with options:', JSON.stringify({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    }));

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.response);
      res.status(200).json({ success: true, message: 'Withdrawal notification sent successfully' });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      res.status(500).json({ error: `Failed to send email: ${emailError.message}` });
    }
  } catch (error) {
    console.error('Error in withdrawal notification handler:', error);
    res.status(500).json({ error: error.message });
  }
} 