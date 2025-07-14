import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields: email and name' });
  }

  // These credentials should be stored in environment variables
  const emailUser = process.env.HOST_APPROVAL_EMAIL_USER;
  const emailPass = process.env.HOST_APPROVAL_EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error('Email service not configured on the server.');
    // We send a 500 error but don't want to expose the reason to the client.
    return res.status(500).json({ error: 'Internal server error' });
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
    console.log('Development mode: Bypassing TLS certificate validation for application confirmation.');
  }

  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: `"Freefire Tournaments" <${emailUser}>`,
    to: email,
    subject: 'We Have Received Your Host Application!',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #000;">Thank You for Applying!</h3>
        <p>Hello, ${name},</p>
        <p>We've successfully received your application to become a tournament host on our platform.</p>
        <p>Our team will carefully review your application. We appreciate your patience and will get back to you within the next <strong>2-3 business days</strong> with an update.</p>
        <p>Thank you for your interest in joining our hosting team and contributing to the community!</p>
        <br/>
        <p>Best regards,<br/>The Freefire Tournaments Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Failed to send application confirmation email:', error);
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
} 