// Firebase config helper for API endpoints
// This ensures both VITE_ prefixed env vars (for local dev) and non-prefixed (for Vercel) work

export function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
  };
}

export function getEmailConfig() {
  return {
    user: process.env.EMAIL_USER || 'freefiretournaments03@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'eyym uhok glkx gony' // This fallback should only be used in development
  };
}

export function debugEnvironment() {
  // Safely debug environment variables
  return {
    firebase: {
      apiKey: !!process.env.FIREBASE_API_KEY || !!process.env.VITE_FIREBASE_API_KEY,
      authDomain: !!process.env.FIREBASE_AUTH_DOMAIN || !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.FIREBASE_PROJECT_ID || !!process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET || !!process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.FIREBASE_MESSAGING_SENDER_ID || !!process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.FIREBASE_APP_ID || !!process.env.VITE_FIREBASE_APP_ID
    },
    email: {
      user: !!process.env.EMAIL_USER,
      pass: !!process.env.EMAIL_PASSWORD
    },
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  };
}
