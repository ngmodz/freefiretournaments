import nodemailer from 'nodemailer';
import { db } from './firebase-admin-helper.js';

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

const sendTournamentStartEmail = async (recipients, tournamentName) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"Freefire Tournaments" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Sending to a single address, participants are in Bcc
    bcc: recipients,
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { tournamentId } = req.body;

  if (!tournamentId) {
    return res.status(400).json({ error: 'Missing required field: tournamentId' });
  }

  try {
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const tournamentDoc = await tournamentRef.get();

    if (!tournamentDoc.exists) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentDoc.data();
    const participantUids = tournament.participantUids || [];

    if (participantUids.length === 0) {
      return res.status(200).json({ success: true, message: 'No participants to notify.' });
    }

    const userPromises = participantUids.map(uid => 
      db.collection('users').doc(uid).get()
    );
    
    const userDocs = await Promise.all(userPromises);
    
    const recipientEmails = userDocs
      .filter(doc => doc.exists && doc.data().email)
      .map(doc => doc.data().email);

    if (recipientEmails.length > 0) {
      await sendTournamentStartEmail(recipientEmails, tournament.name);
      console.log(`Sent start notification for tournament ${tournamentId} to ${recipientEmails.length} participants.`);
    }

    res.status(200).json({ success: true, message: 'Notification emails sent successfully.' });
  } catch (error) {
    console.error(`Failed to send start tournament notifications for ${tournamentId}:`, error);
    res.status(500).json({ error: `Failed to send notifications: ${error.message}` });
  }
} 