 

import nodemailer from 'nodemailer';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';

let adminApp;
function getAdminApp() {
  if (!adminApp) {
    adminApp = initializeApp({
      credential: applicationDefault(),
    });
  }
  return adminApp;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name } = req.body;

  // Try to fetch the user's full name from Firestore if possible
  let fullName = name;
  try {
    if (email) {
      getAdminApp();
      const db = getFirestore();
      const usersRef = db.collection('users');
      const userSnap = await usersRef.where('email', '==', email).limit(1).get();
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.fullName) {
          fullName = userData.fullName;
        } else if (userData.displayName) {
          fullName = userData.displayName;
        } else if (userData.name) {
          fullName = userData.name;
        }
      }
    }
  } catch (err) {
    console.error('Could not fetch user full name from Firestore:', err.message);
  }

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields: email and name' });
  }

  let emailUser;
  let emailPass;

  if (process.env.HOST_APPROVAL_EMAIL_USER && process.env.HOST_APPROVAL_EMAIL_PASSWORD) {
    emailUser = process.env.HOST_APPROVAL_EMAIL_USER;
    emailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;
    console.log('Using HOST_APPROVAL_EMAIL credentials');
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailUser = process.env.EMAIL_USER;
    emailPass = process.env.EMAIL_PASSWORD;
    console.log('Using fallback EMAIL credentials');
  } else {
    console.error('No email credentials found in environment variables');
    return res.status(500).json({ error: 'Email service not configured' });
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
    console.log('Development mode: Bypassing TLS certificate validation.');
  }

  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: `"Freefire Tournaments" <${emailUser}>`,
    to: email,
    subject: 'Congratulations! Your Host Application has been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
        <h2 style="color: #000;">Congratulations, ${fullName}!</h2>
        <p>We are thrilled to inform you that your application to become a tournament host has been approved!</p>
        <p>You can now create and manage your own tournaments on our platform. We are excited to see the amazing events you will host for the community.</p>
        <p>To get started, head over to the \"Create Tournament\" section on our website. If you have any questions, feel free to reach out to our support team.</p>
        <p>Welcome to the team!</p>
        <br/>
        <p>Best regards,<br/>The Freefire Tournaments Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Approval email sent successfully' });
  } catch (error) {
    console.error('Failed to send approval email:', error);
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
} 