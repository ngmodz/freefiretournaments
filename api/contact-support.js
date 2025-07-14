import { db } from './firebase-admin-helper.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Internal Server Error: Database not initialized.' });
  }

  try {
    const { name, email, subject, message, uid } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, subject, message' });
    }

    const submission = {
      name,
      email,
      subject,
      message,
      uid: uid || null, // Store uid if provided
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new', // Default status
    };

    const docRef = await db.collection('contactSubmissions').add(submission);

    res.status(200).json({ success: true, message: 'Your message has been submitted successfully.', id: docRef.id });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 