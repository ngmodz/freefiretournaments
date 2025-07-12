import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig } from './firebase-config-helper.js';

// Email configuration
const emailConfig = getEmailConfig();

// Configure email transporter
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass
  },
  tls: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, userName, amount, status, notes, processedAt } = req.body;

    if (!userEmail || !userName || !amount || !status || !processedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: userEmail, userName, amount, status, processedAt' 
      });
    }

    // Format the processed date
    const processedDate = new Date(processedAt);
    const formattedDate = processedDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    // Prepare email content based on status
    let subject, htmlContent;

    if (status === 'completed') {
      subject = `✅ Withdrawal Request Completed - ₹${amount.toLocaleString()}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10B981;">Withdrawal Completed Successfully!</h1>
          </div>
          
          <p>Hello ${userName},</p>
          
          <p>Great news! Your withdrawal request has been <strong>completed successfully</strong>.</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h2 style="color: #10B981; margin-top: 0;">Withdrawal Details</h2>
            <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
            <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Completed</span></p>
            <p><strong>Processed Date:</strong> ${formattedDate} IST</p>
            <p><strong>Transaction ID:</strong> WD${Date.now()}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Important Information</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Funds have been transferred to your UPI account</li>
              <li>You should receive the amount within 2-3 business days</li>
              <li>Keep this email for your records</li>
              <li>Contact support if you don't receive the amount within 3 days</li>
            </ul>
          </div>
          
          ${notes ? `
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">Admin Notes</h3>
            <p style="margin: 0; color: #1E40AF;">${notes}</p>
          </div>
          ` : ''}
          
          <p>Thank you for using our platform!</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification. Please do not reply to this email.</p>
            <p style="font-size: 12px; color: #666;">For support, contact: freefiretournaments03@gmail.com</p>
          </div>
        </div>
      `;
    } else if (status === 'rejected') {
      subject = `❌ Withdrawal Request Rejected - ₹${amount.toLocaleString()}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #EF4444;">Withdrawal Request Rejected</h1>
          </div>
          
          <p>Hello ${userName},</p>
          
          <p>We regret to inform you that your withdrawal request has been <strong>rejected</strong>.</p>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h2 style="color: #EF4444; margin-top: 0;">Withdrawal Details</h2>
            <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
            <p><strong>Status:</strong> <span style="color: #EF4444; font-weight: bold;">Rejected</span></p>
            <p><strong>Processed Date:</strong> ${formattedDate} IST</p>
            <p><strong>Request ID:</strong> WD${Date.now()}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">Reason for Rejection</h3>
            <p style="margin: 0; color: #1E40AF;">${notes || 'No specific reason provided'}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>The requested amount has been returned to your wallet balance</li>
              <li>You can submit a new withdrawal request after addressing the issue</li>
              <li>Contact support if you have questions about the rejection</li>
            </ul>
          </div>
          
          <p>If you believe this rejection was made in error, please contact our support team.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification. Please do not reply to this email.</p>
            <p style="font-size: 12px; color: #666;">For support, contact: freefiretournaments03@gmail.com</p>
          </div>
        </div>
      `;
    } else {
      return res.status(400).json({ error: 'Invalid status. Must be "completed" or "rejected"' });
    }

    // Send the email
    const mailOptions = {
      from: `"Freefire Tournaments Admin" <${emailConfig.user}>`,
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log(`Withdrawal notification sent to ${userEmail}: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `Email notification sent successfully to ${userEmail}`
    });

  } catch (error) {
    console.error('Error sending withdrawal notification:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email notification'
    });
  }
} 