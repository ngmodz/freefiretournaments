// Netlify function to add wallet fields to a specific user
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Check if this is a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const { userId, adminKey } = JSON.parse(event.body);
    
    // Simple security check (you should use a more secure method in production)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Validate userId
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }
    
    // Get the user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `User with ID ${userId} not found` })
      };
    }
    
    // Update the user document with wallet fields
    await userRef.update({
      'wallet': {
        tournamentCredits: 100,
        hostCredits: 10,
        earnings: 0,
        totalPurchasedTournamentCredits: 100,
        totalPurchasedHostCredits: 10,
        firstPurchaseCompleted: true
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Wallet fields added to user ${userId}`,
        userId
      })
    };
  } catch (error) {
    console.error('Error adding wallet fields:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    };
  }
}; 