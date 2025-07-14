import nodemailer from 'nodemailer';

// Use general-purpose email credentials
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;
const supportRecipient = process.env.SUPPORT_EMAIL_RECIPIENT || emailUser; // Send to self if not specified

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!emailUser || !emailPass) {
      console.error('Email credentials not found in environment variables');
      return res.status(500).json({ error: 'Server email configuration is incomplete' });
    }

    const { name, email, subject, message, uid } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // 1. Email to your support inbox
    const supportMailOptions = {
      from: `"${name}" <${emailUser}>`,
      to: supportRecipient,
      replyTo: email,
      subject: `New Support Ticket: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
          <h2>New Support Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>User ID:</strong> ${uid || 'Not provided'}</p>
          <hr>
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    };

    // 2. Confirmation email to the user
    const userMailOptions = {
      from: `"Freefire Tournaments Support" <${emailUser}>`,
      to: email,
      subject: 'We have received your support request',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
          <p>Dear ${name},</p>
          <p>Thank you for contacting us. We have successfully received your message and will get back to you as soon as possible.</p>
          <p>Here is a copy of your message:</p>
          <blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 5px;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p>${message}</p>
          </blockquote>
          <p>Best regards,<br>The Support Team</p>
        </div>
      `,
    };

    // Send both emails
    await transporter.sendMail(supportMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ success: true, message: 'Support message sent successfully' });

  } catch (error) {
    console.error('Error in contact-support handler:', error);
    res.status(500).json({ error: `Failed to send message: ${error.message}` });
  }
} 