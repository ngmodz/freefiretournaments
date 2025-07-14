import nodemailer from 'nodemailer';
import { db, auth } from './firebase-admin-helper.js';

// Use general-purpose email credentials
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;
const supportRecipient = process.env.SUPPORT_EMAIL_RECIPIENT || emailUser;

const handlePostRequest = async (req, res) => {
    try {
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
        console.error('Error in handlePostRequest:', error);
        res.status(500).json({ error: `Failed to send message: ${error.message}` });
    }
};

const handleGetRequest = async (req, res) => {
    if (!db || !auth) {
        return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    try {
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);

        if (decodedToken.admin !== true) {
            return res.status(403).json({ error: 'Forbidden: User is not an admin' });
        }

        const submissionsSnapshot = await db.collection('contactSubmissions').orderBy('createdAt', 'desc').get();
        const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Error in handleGetRequest:', error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await handlePostRequest(req, res);
    } else if (req.method === 'GET') {
        await handleGetRequest(req, res);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 