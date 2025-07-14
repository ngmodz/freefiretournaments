import { db, auth } from './firebase-admin-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db || !auth) {
    return res.status(500).json({ error: 'Internal Server Error: Firebase Admin not initialized.' });
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
    
    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
} 