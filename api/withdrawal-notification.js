import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig } from './firebase-config-helper.js';

const getTransporter = (emailUser, emailPass) => {
  console.log(`Creating transporter with user: ${emailUser}`);
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    debug: true,
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendWithdrawalRequestEmail = (transporter, mailOptions) => {
  return transporter.sendMail(mailOptions);
};

const sendWithdrawalProcessedEmail = (transporter, mailOptions) => {
  return transporter.sendMail(mailOptions);
};

export default async function handler(req, res) {
  try {
    const { type, userId, userEmail, userName, amount, upiId, originalAmount, commission } = req.body;

    if (!type || !userId || !userEmail || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let subject, htmlBody, emailUser, emailPass;

    if (type === 'request') {
      subject = `Your Withdrawal Request has been Received`;
      htmlBody = `
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
      if (process.env.WITHDRAWAL_REQUEST_EMAIL_USER && process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD) {
        emailUser = process.env.WITHDRAWAL_REQUEST_EMAIL_USER;
        emailPass = process.env.WITHDRAWAL_REQUEST_EMAIL_PASSWORD;
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        emailUser = process.env.EMAIL_USER;
        emailPass = process.env.EMAIL_PASSWORD;
      }
    } else if (type === 'processed') {
      subject = `Your Withdrawal Request has been Processed`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; font-size: 15px;">
          <p>Dear ${userName || 'User'},</p>
          <p>Your withdrawal request of <b>₹${Number(amount).toFixed(2)}</b> has been successfully processed on ${formattedDate}.</p>
          <p>The amount has been sent to your UPI ID: <b>${upiId || 'Not provided'}</b>.</p>
          <p>Thank you for using our platform!</p>
          <br/>
          <p>Best regards,<br/>The Team<br/>Freefire Tournaments</p>
        </div>
      `;
      if (process.env.WITHDRAWAL_EMAIL_USER && process.env.WITHDRAWAL_EMAIL_PASSWORD) {
        emailUser = process.env.WITHDRAWAL_EMAIL_USER;
        emailPass = process.env.WITHDRAWAL_EMAIL_PASSWORD;
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        emailUser = process.env.EMAIL_USER;
        emailPass = process.env.EMAIL_PASSWORD;
      }
    } else {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'No email credentials found in environment variables' });
    }

    const transporter = getTransporter(emailUser, emailPass);

    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Connection verification failed:', verifyError);
      return res.status(500).json({ error: `SMTP connection failed: ${verifyError.message}` });
    }

    const mailOptions = {
      from: `"Freefire Tournaments" <${emailUser}>`,
      to: userEmail,
      subject: subject,
      html: htmlBody,
    };

    try {
      let info;
      if (type === 'request') {
        info = await sendWithdrawalRequestEmail(transporter, mailOptions);
      } else {
        info = await sendWithdrawalProcessedEmail(transporter, mailOptions);
      }
      console.log(`Withdrawal ${type} notification email sent successfully:`, info.response);
      res.status(200).json({ success: true, message: `Withdrawal ${type} notification sent successfully` });
    } catch (emailError) {
      console.error(`Failed to send withdrawal ${type} notification email:`, emailError);
      res.status(500).json({ error: `Failed to send email: ${emailError.message}` });
    }
  } catch (error) {
    console.error('Error in withdrawal notification handler:', error);
    res.status(500).json({ error: error.message });
  }
} 