import nodemailer from 'nodemailer';
import { db } from './firebase-admin-helper.js';

// Reusable email transporter configuration with better resilience
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error('Email credentials (EMAIL_USER, EMAIL_PASSWORD) are not set in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV !== 'development',
    },
    // Add connection pooling and timeout settings for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10, // 10 emails per second
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
  });
};

/**
 * A generic email sending function with retry logic and better error handling.
 * @param {object} mailOptions - The mail options for nodemailer.
 */
const sendEmail = async (mailOptions, retries = 3) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Failed to create email transporter. Check server environment variables.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Email sending attempt ${attempt} failed:`, error.message);
      
      // Check if it's a network-related error that might be retryable
      const isRetryableError = error.code === 'ECONNRESET' || 
                               error.code === 'ESOCKET' || 
                               error.code === 'ETIMEDOUT' ||
                               error.code === 'ENOTFOUND' ||
                               error.syscall === 'read';
      
      if (attempt < retries && isRetryableError) {
        console.log(`Retrying email send in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      // If not retryable or last attempt, throw the error
      throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
    }
  }
};

/**
 * Notifies a host that they have been penalized for not starting a tournament.
 * @param {string} hostEmail - The email address of the host.
 * @param {string} tournamentName - The name of the tournament.
 */
export const sendHostPenaltyEmail = async (hostEmail, tournamentName, penaltyAmount) => {
  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: hostEmail,
    subject: `Tournament Penalty Notice - ${tournamentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #dc3545;">Tournament Penalty Notice</h2>
        <p>Dear Host,</p>
        <p>You have been penalized for not starting the tournament <strong>"${tournamentName}"</strong> within the required time.</p>
        <p><strong>Penalty Amount:</strong> ${penaltyAmount} credits</p>
        <p>This amount has been deducted from your tournament credits balance.</p>
        <p>Please ensure you start tournaments on time to avoid future penalties.</p>
        <p>If you believe this penalty was issued in error, please contact our support team.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 14px; color: #666;">Thank you for your understanding.</p>
        <p style="font-size: 14px; color: #666;">Best regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  return sendEmail(mailOptions);
};

/**
 * Notifies participants when a tournament has been cancelled by the moderator.
 * @param {string[]} participantEmails - Array of participant email addresses.
 * @param {string} tournamentName - The name of the cancelled tournament.
 * @param {number} refundAmount - The refund amount per participant.
 */
export const sendTournamentCancellationEmail = async (participantEmails, tournamentName, refundAmount) => {
  // Don't send to empty lists
  if (!participantEmails || participantEmails.length === 0) {
    console.log('No participant emails provided for cancellation notification');
    return;
  }

  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to ourselves
    bcc: participantEmails, // Blind copy to all participants
    subject: `Tournament Cancelled: ${tournamentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #dc3545;">Tournament Cancelled</h2>
        <p>Dear Participant,</p>
        <p>We regret to inform you that the tournament <strong>"${tournamentName}"</strong> has been cancelled by the moderator.</p>
        ${refundAmount > 0 ? `<p><strong>Refund:</strong> Your entry fee of ${refundAmount} credits has been refunded to your account.</p>` : ''}
        <p>We apologize for any inconvenience this may have caused.</p>
        <p>Please check out other exciting tournaments available on our platform!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 14px; color: #666;">Thank you for your understanding.</p>
        <p style="font-size: 14px; color: #666;">Best regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  return sendEmail(mailOptions);
};

/**
 * Records tournament-related information in the database for audit/tracking.
 * @param {string} type - The type of event.
 * @param {object} data - The event data.
 */
export const recordTournamentEvent = async (type, data) => {
  try {
    await db.collection('tournament_events').add({
      type,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to record tournament event:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Notifies a user that they have won a prize in a tournament.
 * @param {string} winnerEmail - The email address of the winning user.
 * @param {string} tournamentName - The name of the tournament.
 * @param {number} prizeAmount - The amount of credits won.
 */
export const sendTournamentWinningsEmail = async (winnerEmail, tournamentName, prizeAmount) => {
  console.log(`📧 Preparing to send tournament winnings email:`, {
    to: winnerEmail,
    tournamentName,
    prizeAmount
  });
  
  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: winnerEmail,
    subject: `Congratulations! You Won a Prize in "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; border: 1px solid #ddd; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #28a745; font-size: 28px; margin-bottom: 10px;">🏆 Congratulations! 🏆</h2>
        <p style="font-size: 18px;">You've won a prize in the tournament:</p>
        <p style="font-size: 22px; font-weight: bold; color: #007bff; margin: 10px 0;">${tournamentName}</p>
        <p style="font-size: 18px;">We have credited your account with:</p>
        <p style="font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0;">${prizeAmount} Credits</p>
        <p style="font-size: 16px; margin-top: 20px;">You can use these credits to join more tournaments and win bigger prizes!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 14px; color: #666;">Thank you for playing with us. We hope to see you in the next tournament!</p>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">Best regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  
  console.log(`📧 Sending email via sendEmail function...`);
  return sendEmail(mailOptions);
};
