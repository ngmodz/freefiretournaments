// Firebase config helper for API endpoints
// Uses backend-specific config that matches the working local script configuration

export function getFirebaseConfig() {
  return {
    apiKey: process.env.BACKEND_FIREBASE_API_KEY,
    authDomain: process.env.BACKEND_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.BACKEND_FIREBASE_PROJECT_ID,
    storageBucket: process.env.BACKEND_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.BACKEND_FIREBASE_APP_ID
  };
}

export function getEmailConfig() {
  return {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  };
}

export function debugEnvironment() {
  // Safely debug environment variables
  return {
    firebase: {
      apiKey: !!process.env.BACKEND_FIREBASE_API_KEY,
      authDomain: !!process.env.FIREBASE_AUTH_DOMAIN || !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.FIREBASE_PROJECT_ID || !!process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET || !!process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.BACKEND_FIREBASE_APP_ID
    },
    email: {
      user: !!process.env.EMAIL_USER,
      pass: !!process.env.EMAIL_PASSWORD
    },
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  };
}
