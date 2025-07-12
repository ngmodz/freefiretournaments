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

    const transactionId = `WDL-${Date.now()}`;
    const transactionDate = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    const walletUrl = `${process.env.APP_URL || 'http://localhost:8083'}/wallet`;
    const termsUrl = `${process.env.APP_URL || 'http://localhost:8083'}/terms-and-privacy`;

    const subject = `Your Withdrawal Request has been Processed`;
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 15px;">
        <p>Dear ${userName || 'User'},</p>
        <p>Your withdrawal request of <b>₹${Number(amount).toFixed(2)}</b> has been successfully processed on ${formattedDate}.</p>
        <p>The amount has been sent to your UPI ID: <b>${upiId || 'Not provided'}</b>.</p>
        <p>Thank you for using our platform!</p>
        <br/>
        <p>Best regards,<br/>The Team<br/>Freefire Tournaments</p>
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
      from: `"Freefire Tournaments" <${emailUser}>`,
      to: userEmail,
      subject: subject,
      html: htmlBody,
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