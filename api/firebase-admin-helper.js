import admin from 'firebase-admin';

let db;
let auth;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log("Firebase Admin SDK already initialized.");
    db = admin.firestore();
    auth = admin.auth();
    return;
  }

  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;

    let serviceAccount;

    if (serviceAccountBase64) {
      console.log("Found FIREBASE_SERVICE_ACCOUNT_BASE64. Parsing from base64...");
      serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
    } else if (serviceAccountJSON) {
      console.log("Found FIREBASE_SERVICE_ACCOUNT. Parsing from JSON string...");
      serviceAccount = JSON.parse(serviceAccountJSON);
    } else {
      throw new Error('Neither FIREBASE_SERVICE_ACCOUNT_BASE64 nor FIREBASE_SERVICE_ACCOUNT environment variables are set.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin SDK initialized successfully.");
    db = admin.firestore();
    auth = admin.auth();
  } catch (error) {
    console.error('Firebase admin initialization error:', error.message);
    // This will cause db and auth to be undefined, and subsequent API calls will fail gracefully.
  }
}

initializeFirebaseAdmin();

export { db, auth }; 