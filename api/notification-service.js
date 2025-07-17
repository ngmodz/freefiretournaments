import nodemailer from 'nodemailer';
import { db } from './firebase-admin-helper.js';

// Reusable email transporter configuration
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
  });
};

/**
 * A generic email sending function.
 * @param {object} mailOptions - The mail options for nodemailer.
 */
const sendEmail = async (mailOptions) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Failed to create email transporter. Check server environment variables.');
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email:`, error);
    throw error; // Rethrow to be handled by the caller
  }
};

/**
 * Notifies a host that they have been penalized for not starting a tournament.
 * @param {string} hostEmail - The email address of the host.
 * @param {string} tournamentName - The name of the tournament.
 */
export const sendHostPenaltyEmail = async (hostEmail, tournamentName) => {
  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: hostEmail,
    subject: `Penalty Applied for Tournament: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h3 style="color: #dc3545; background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 5px solid #dc3545; margin-bottom: 20px; text-align: center; font-weight: bold;">⚠️ PENALTY NOTICE ⚠️</h3>
        <p>Hello,</p>
        <p>This is to inform you that a penalty of <b style="color: #dc3545;">10 credits</b> has been applied to your account.</p>
        <p><b>Reason:</b> Your tournament, "<b>${tournamentName}</b>," was not started within 10 minutes of its scheduled time.</p>
        <p>Please ensure that you start your tournaments on time to avoid further penalties or automatic cancellation.</p>
        <p>The tournament will be automatically cancelled if it is not started within 20 minutes of the scheduled time.</p>
        <br/>
        <p>Regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  return sendEmail(mailOptions);
};

/**
 * Notifies a host that their tournament has been automatically cancelled.
 * @param {string} hostEmail - The email address of the host.
 * @param {string} tournamentName - The name of the tournament.
 */
export const sendCancellationEmailToHost = async (hostEmail, tournamentName) => {
  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: hostEmail,
    subject: `Tournament Cancelled: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h3 style="color: #dc3545; background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 5px solid #dc3545; margin-bottom: 20px; text-align: center; font-weight: bold;">🚫 TOURNAMENT CANCELLED 🚫</h3>
        <p>Hello,</p>
        <p>Your tournament, "<b>${tournamentName}</b>," has been automatically cancelled because it was not started within 20 minutes of its scheduled time.</p>
        <p>All entry fees have been refunded to the participants.</p>
        <p>Please make sure to start future tournaments promptly to ensure a good experience for all users.</p>
        <br/>
        <p>Regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  return sendEmail(mailOptions);
};

/**
 * Notifies a participant that a tournament has been cancelled and they have been refunded.
 * @param {string} participantEmail - The email address of the participant.
 * @param {string} tournamentName - The name of the tournament.
 * @param {number} entryFee - The entry fee that was refunded.
 */
export const sendCancellationEmailToParticipant = async (participantEmail, tournamentName, entryFee) => {
  const mailOptions = {
    from: `"FreeFire Tournaments" <${process.env.EMAIL_USER}>`,
    to: participantEmail,
    subject: `Tournament Cancelled & Refunded: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h3 style="color: #dc3545; background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 5px solid #dc3545; margin-bottom: 20px; text-align: center; font-weight: bold;">🚫 TOURNAMENT CANCELLED 🚫</h3>
        <p>Hello,</p>
        <p>The tournament you joined, "<b>${tournamentName}</b>," has been cancelled because the host did not start it on time.</p>
        <p>We have processed a full refund of your entry fee. <b style="color: #28a745;">${entryFee} credits</b> have been returned to your tournament wallet.</p>
        <p>We apologize for any inconvenience this may have caused.</p>
        <br/>
        <p>Regards,<br/>The FreeFire Tournaments Team</p>
      </div>
    `,
  };
  return sendEmail(mailOptions);
};

/**
 * Fetches the email address for a given user ID.
 * @param {string} userId - The Firebase UID of the user.
 * @returns {Promise<string|null>} The user's email or null if not found.
 */
export const getUserEmail = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return userDoc.data().email || null;
    }
    console.warn(`Could not find user document for ID: ${userId}`);
    return null;
  } catch (error) {
    console.error(`Failed to get email for user ${userId}:`, error);
    return null;
  }
};

/**
 * Notifies a user that they have won a prize in a tournament.
 * @param {string} winnerEmail - The email address of the winning user.
 * @param {string} tournamentName - The name of the tournament.
 * @param {number} prizeAmount - The amount of credits won.
 */
export const sendTournamentWinningsEmail = async (winnerEmail, tournamentName, prizeAmount) => {
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
  return sendEmail(mailOptions);
}; 