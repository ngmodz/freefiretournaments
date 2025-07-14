import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig } from './firebase-config-helper.js';

// Use withdrawal request-specific email credentials
const emailConfig = {
  user: process.env.WITHDRAWAL_REQUEST_EMAIL_USER,
  pass: process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD
};

console.log("Attempting to use withdrawal request email config:", {
  user: emailConfig.user ? 'OK' : 'MISSING',
  pass: emailConfig.pass ? 'OK' : 'MISSING'
});

export default async function handler(req, res) {
  try {
    // Log all environment variables related to email
    console.log('DEBUGGING WITHDRAWAL REQUEST EMAIL CONFIGURATION:');
    console.log(`WITHDRAWAL_REQUEST_EMAIL_USER: ${process.env.WITHDRAWAL_REQUEST_EMAIL_USER || 'NOT SET'}`);
    console.log(`WITHDRAWAL_REQUEST_EMAIL_PASSWORD length: ${process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD ? process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD.length : 'NOT SET'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET'}`);
    
    const { userId, userEmail, userName, amount, upiId, transactionId, originalAmount, commission } = req.body;
    
    if (!userId || !userEmail || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const requestDate = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const subject = `Your Withdrawal Request has been Received`;
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 15px; color: #000;">
        <p>Dear ${userName || 'User'},</p>
        <p>We have successfully received your withdrawal request of <b>₹${Math.floor(Number(originalAmount || amount))}</b> on ${formattedDate}.</p>
        <p><b style='color: #000;'>Platform Fee (4%):</b> -₹${commission !== undefined ? Math.floor(Number(commission)) : (originalAmount ? Math.floor(Number(originalAmount) - Number(amount)) : '0')}</p>
        <p>After deductions, you will receive <b style='color: #000;'>₹${Math.floor(Number(amount))}</b> in your account.</p>
        <p><b style='color: #000;'>UPI ID:</b> ${upiId || 'Not provided'}</p>
        <p>Your request is now under review by our team. We will process your withdrawal within 2-3 business days. You will receive another email once the withdrawal is processed.</p>
        <p>Thank you for using our platform!</p>
        <br/>
        <p>Best regards,<br/>The Team<br/>Freefire Tournaments</p>
      </div>
    `;

    // First try with WITHDRAWAL_REQUEST_EMAIL credentials
    let transporter;
    let emailUser;
    let emailPass;
    
    if (process.env.WITHDRAWAL_REQUEST_EMAIL_USER && process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD) {
      emailUser = process.env.WITHDRAWAL_REQUEST_EMAIL_USER;
      emailPass = process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD;
      console.log('Using WITHDRAWAL_REQUEST_EMAIL credentials for request notification');
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      emailUser = process.env.EMAIL_USER;
      emailPass = process.env.EMAIL_PASSWORD;
      console.log('Using fallback EMAIL credentials for request notification');
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

    console.log('Sending withdrawal request notification email with options:', JSON.stringify({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    }));

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Withdrawal request notification email sent successfully:', info.response);
      res.status(200).json({ success: true, message: 'Withdrawal request notification sent successfully' });
    } catch (emailError) {
      console.error('Failed to send withdrawal request notification email:', emailError);
      res.status(500).json({ error: `Failed to send email: ${emailError.message}` });
    }
  } catch (error) {
    console.error('Error in withdrawal request notification handler:', error);
    res.status(500).json({ error: error.message });
  }
} 