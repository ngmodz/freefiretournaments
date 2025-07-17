import nodemailer from 'nodemailer';
import { db, auth } from './firebase-admin-helper.js';
import { getEmailConfig } from './firebase-config-helper.js';

// Universal email configuration
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error('Email credentials not found in environment variables.');
    return null;
  }

  const transporterOptions = {
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    transporterOptions.tls = {
        rejectUnauthorized: false
    };
  }

  return nodemailer.createTransport(transporterOptions);
};

// Contact form handler
const handleContactRequest = async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const supportRecipient = process.env.SUPPORT_EMAIL_RECIPIENT || emailUser;

    if (!emailUser || !emailPass) {
      console.error('Email credentials not found');
      return res.status(500).json({ error: 'Server email configuration is incomplete' });
    }

    const { name, email, subject, message, uid } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false }
    });

    // Save to database
    const supportDoc = {
      name,
      email,
      subject,
      message,
      uid: uid || null,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('supportSubmissions').add(supportDoc);

    // 1. Email to support inbox
    const supportMailOptions = {
      from: `"${name}" <${emailUser}>`,
      to: supportRecipient,
      replyTo: email,
      subject: `New Support Ticket: ${subject}`,
      html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>UID: ${uid || 'N/A'}</p><p>Message: ${message}</p>`
    };

    // 2. Confirmation email to user
    const userMailOptions = {
      from: `"Freefire Tournaments Support" <${emailUser}>`,
      to: email,
      subject: 'We have received your support request',
      html: `<p>Dear ${name},</p><p>Thank you for contacting us. We have received your message and will get back to you shortly.</p>`
    };

    await transporter.sendMail(supportMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ success: true, message: 'Support message sent successfully' });
  } catch (error) {
    console.error('Error in handleContactRequest:', error);
    res.status(500).json({ error: `Failed to send message: ${error.message}` });
  }
};

// Contact form submissions handler (for admin panel)
const handleContactSubmissions = async (req, res) => {
  try {
    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Get all support submissions
    const submissionsSnapshot = await db.collection('supportSubmissions')
      .orderBy('createdAt', 'desc')
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString(),
      updatedAt: doc.data().updatedAt.toDate().toISOString()
    }));

    res.status(200).json({ 
      success: true, 
      data: submissions 
    });
  } catch (error) {
    console.error('Error in handleContactSubmissions:', error);
    res.status(500).json({ error: `Failed to fetch submissions: ${error.message}` });
  }
};

// Tournament notification handler
const handleTournamentNotification = async (req, res) => {
  try {
    const { tournamentId, tournamentName } = req.body;

    if (!tournamentId || !tournamentName) {
      return res.status(400).json({ error: 'Tournament ID and name are required' });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Get tournament participants
    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
    if (!tournamentDoc.exists) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentDoc.data();
    const participants = tournament.participants || [];

    if (participants.length === 0) {
      return res.status(400).json({ error: 'No participants found' });
    }

    // Get participant emails
    const participantEmails = [];
    for (const participant of participants) {
      try {
        const userRecord = await auth.getUser(participant.uid);
        if (userRecord.email) {
          participantEmails.push(userRecord.email);
        }
      } catch (error) {
        console.error(`Error getting user ${participant.uid}:`, error);
      }
    }

    if (participantEmails.length === 0) {
      return res.status(400).json({ error: 'No valid participant emails found' });
    }

    const mailOptions = {
      from: `"Freefire Tournaments" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      bcc: participantEmails,
      subject: `Tournament Started: ${tournamentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3 style="color: #000;">The tournament "${tournamentName}" has started!</h3>
          <p>Hello,</p>
          <p>The tournament you joined, <strong>${tournamentName}</strong>, has just been started by the host.</p>
          <p>Please join the room as soon as possible to participate.</p>
          <p>Good luck and have fun!</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: `Tournament start notification sent to ${participantEmails.length} participants` 
    });
  } catch (error) {
    console.error('Error in handleTournamentNotification:', error);
    res.status(500).json({ error: `Failed to send notifications: ${error.message}` });
  }
};

// Withdrawal notification handler
const handleWithdrawalNotification = async (req, res) => {
  try {
    const { type, userId, userEmail, userName, amount, upiId, originalAmount, commission } = req.body;

    if (!type || !userId || !userEmail || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailConfig = getEmailConfig();
    const emailUser = emailConfig.user;
    const emailPass = emailConfig.pass;

    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email configuration not found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
      debug: true,
      tls: { rejectUnauthorized: false }
    });

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let subject, htmlBody;

    if (type === 'request') {
      subject = `Your Withdrawal Request has been Received`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #000;">
          <p>Dear ${userName || 'User'},</p>
          <p>We have successfully received your withdrawal request of <b>₹${Math.floor(Number(originalAmount || amount))}</b> on ${formattedDate}.</p>
          <p><b style='color: #000;'>Platform Fee (4%):</b> -₹${commission !== undefined ? Math.floor(Number(commission)) : (originalAmount ? Math.floor(Number(originalAmount) - Number(amount)) : '0')}</p>
          <p>After deductions, you will receive <b style='color: #000;'>₹${Math.floor(Number(amount))}</b> in your account.</p>
          <p>Our team will process your request within 24 hours.</p>
          <p>Thank you for using our platform!</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team</p>
        </div>
      `;
    } else if (type === 'processed') {
      subject = `Your Withdrawal Request has been Processed`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #000;">
          <p>Dear ${userName || 'User'},</p>
          <p>Great news! Your withdrawal request of <b>₹${Math.floor(Number(amount))}</b> has been processed successfully on ${formattedDate}.</p>
          <p>The money has been transferred to your UPI ID: <b>${upiId}</b></p>
          <p>It may take a few minutes to reflect in your account depending on your bank.</p>
          <p>Thank you for using our platform!</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team</p>
        </div>
      `;
    } else {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const mailOptions = {
      from: `"Freefire Tournaments" <${emailUser}>`,
      to: userEmail,
      subject: subject,
      html: htmlBody
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Withdrawal notification sent successfully' });
  } catch (error) {
    console.error('Error in handleWithdrawalNotification:', error);
    res.status(500).json({ error: `Failed to send withdrawal notification: ${error.message}` });
  }
};

// General email handler
const handleGeneralEmail = async (req, res) => {
  let type = 'unknown'; // Default value for error handling
  try {
    const { type: emailType, to, name, ...otherData } = req.body;
    type = emailType; // Set the type for error handling

    if (!type || !to) {
      return res.status(400).json({ error: 'Email type and recipient are required' });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    
    // Use specific host approval email credentials if available and this is a host approval email
    let actualEmailUser = emailUser;
    let actualEmailPass = emailPass;
    
    if (type === 'hostApproval') {
      const hostApprovalEmailUser = process.env.HOST_APPROVAL_EMAIL_USER;
      const hostApprovalEmailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;
      
      if (hostApprovalEmailUser && hostApprovalEmailPass) {
        actualEmailUser = hostApprovalEmailUser;
        actualEmailPass = hostApprovalEmailPass;
        console.log('Using specific host approval email credentials');
      }
    }

    if (!actualEmailUser || !actualEmailPass) {
      return res.status(500).json({ error: 'Email configuration not found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: actualEmailUser, pass: actualEmailPass },
      tls: { rejectUnauthorized: false }
    });

    let subject = '';
    let html = '';

    if (type === 'applicationConfirmation') {
      subject = 'We Have Received Your Host Application!';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3 style="color: #000;">Thank You for Applying!</h3>
          <p>Hello, ${name},</p>
          <p>We've successfully received your application to become a tournament host on our platform.</p>
          <p>Our team will carefully review your application. We appreciate your patience and will get back to you within the next <strong>2-3 business days</strong> with an update.</p>
          <p>Thank you for your interest in joining our hosting team and contributing to the community!</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team</p>
        </div>
      `;
    } else if (type === 'hostApproval') {
      subject = 'Congratulations! Your Host Application has been Approved';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3 style="color: #28a745;">🎉 Congratulations! Your Host Application has been Approved</h3>
          <p>Hello, ${name},</p>
          <p>Great news! Your application to become a tournament host on our platform has been <strong>approved</strong>!</p>
          <p>You now have access to:</p>
          <ul style="color: #333; margin-left: 20px;">
            <li>Create and manage tournaments</li>
            <li>Access the host dashboard</li>
            <li>Earn commissions from tournaments</li>
            <li>Build your reputation as a trusted host</li>
          </ul>
          <p>To get started, simply log into your account and navigate to the host panel.</p>
          <p>Welcome to the FreeFire Tournaments hosting community!</p>
          <br/>
          <p>Best regards,<br/>The Freefire Tournaments Team</p>
        </div>
      `;
    } else {
      return res.status(400).json({ error: 'Unsupported email type' });
    }

    const mailOptions = {
      from: `"Freefire Tournaments" <${actualEmailUser}>`,
      to: to,
      subject: subject,
      html: html
    };

    console.log(`📧 Sending ${type} email to: ${to}`);
    console.log(`📤 Using email account: ${actualEmailUser}`);
    
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ ${type} email sent successfully to: ${to}`);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error(`❌ Error in handleGeneralEmail (${type}):`, error);
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
};

// Main handler function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Handle GET request for contact submissions (admin panel)
      return await handleContactSubmissions(req, res);
    } else if (req.method === 'POST') {
      const { action } = req.body;

      switch (action) {
        case 'contact':
          return await handleContactRequest(req, res);
        case 'tournament-notification':
          return await handleTournamentNotification(req, res);
        case 'withdrawal-notification':
          return await handleWithdrawalNotification(req, res);
        case 'general-email':
          return await handleGeneralEmail(req, res);
        default:
          return res.status(400).json({ error: 'Invalid action specified' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in email service:', error);
    res.status(500).json({ error: `Email service error: ${error.message}` });
  }
}
