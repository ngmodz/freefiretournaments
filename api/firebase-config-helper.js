// Firebase config helper for API endpoints
// Uses backend-specific config that matches the working local script configuration

export function getFirebaseConfig() {
  // Sanitize environment variables to remove any extraneous characters like newlines
  const sanitize = (value) => (value ? value.replace(/[\r\n]/g, '').trim() : undefined);

  return {
    apiKey: sanitize(process.env.BACKEND_FIREBASE_API_KEY),
    authDomain: sanitize(process.env.BACKEND_FIREBASE_AUTH_DOMAIN),
    projectId: sanitize(process.env.BACKEND_FIREBASE_PROJECT_ID),
    storageBucket: sanitize(process.env.BACKEND_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: sanitize(process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID),
    appId: sanitize(process.env.BACKEND_FIREBASE_APP_ID)
  };
}

export function getEmailConfig() {
  const sanitize = (value) => (value ? value.replace(/[\r\n]/g, '').trim() : undefined);

  return {
    user: sanitize(process.env.EMAIL_USER),
    pass: sanitize(process.env.EMAIL_PASSWORD)
  };
}

export function debugEnvironment() {
  // Safely debug environment variables
  const sanitize = (value) => (value ? value.replace(/[\r\n]/g, '').trim() : undefined);

  return {
    firebase: {
      apiKey: !!sanitize(process.env.BACKEND_FIREBASE_API_KEY),
      authDomain: !!sanitize(process.env.FIREBASE_AUTH_DOMAIN) || !!sanitize(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      projectId: !!sanitize(process.env.FIREBASE_PROJECT_ID) || !!sanitize(process.env.VITE_FIREBASE_PROJECT_ID),
      storageBucket: !!sanitize(process.env.FIREBASE_STORAGE_BUCKET) || !!sanitize(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: !!sanitize(process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID),
      appId: !!sanitize(process.env.BACKEND_FIREBASE_APP_ID)
    },
    email: {
      user: !!sanitize(process.env.EMAIL_USER),
      pass: !!sanitize(process.env.EMAIL_PASSWORD)
    },
    nodeEnv: sanitize(process.env.NODE_ENV),
    vercel: !!process.env.VERCEL
  };
}
