import nodemailer from 'nodemailer';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

let adminApp;
function getAdminApp() {
    if (!adminApp) {
        try {
            adminApp = initializeApp({
                credential: applicationDefault(),
            });
        } catch (e) {
            console.error("Failed to initialize firebase-admin:", e);
        }
    }
    return adminApp;
}

const getTransporter = (emailUser, emailPass) => {
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

const getEmailOptions = (type, to, name) => {
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
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
                <h2 style="color: #000;">Congratulations, ${name}!</h2>
                <p>We are thrilled to inform you that your application to become a tournament host has been approved!</p>
                <p>You can now create and manage your own tournaments on our platform. We are excited to see the amazing events you will host for the community.</p>
                <p>To get started, head over to the "Create Tournament" section on our website. If you have any questions, feel free to reach out to our support team.</p>
                <p>Welcome to the team!</p>
                <br/>
                <p>Best regards,<br/>The Freefire Tournaments Team</p>
            </div>
        `;
    }

    return { subject, html };
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, name, type } = req.body;

    if (!email || !name || !type) {
        return res.status(400).json({ error: 'Missing required fields: email, name, and type' });
    }

    let emailUser, emailPass;
    if (process.env.HOST_APPROVAL_EMAIL_USER && process.env.HOST_APPROVAL_EMAIL_PASSWORD) {
        emailUser = process.env.HOST_APPROVAL_EMAIL_USER;
        emailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        emailUser = process.env.EMAIL_USER;
        emailPass = process.env.EMAIL_PASSWORD;
    } else {
        console.error('No email credentials found in environment variables');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    let finalName = name;
    if (type === 'hostApproval') {
        try {
            getAdminApp();
            const db = getFirestore();
            if (db) {
                const usersRef = db.collection('users');
                const userSnap = await usersRef.where('email', '==', email).limit(1).get();
                if (!userSnap.empty) {
                    const userData = userSnap.docs[0].data();
                    finalName = userData.fullName || userData.displayName || userData.name || name;
                }
            }
        } catch (err) {
            console.error('Could not fetch user full name from Firestore:', err.message);
        }
    }

    const transporter = getTransporter(emailUser, emailPass);
    const { subject, html } = getEmailOptions(type, email, finalName);

    if (!subject) {
        return res.status(400).json({ error: 'Invalid email type specified' });
    }

    const mailOptions = {
        from: `"Freefire Tournaments" <${emailUser}>`,
        to: email,
        subject,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: `Email of type '${type}' sent successfully` });
    } catch (error) {
        console.error(`Failed to send email of type '${type}':`, error);
        res.status(500).json({ error: `Failed to send email: ${error.message}` });
    }
} 