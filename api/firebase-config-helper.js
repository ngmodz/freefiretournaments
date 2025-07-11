// Firebase config helper for API endpoints
// Uses backend-specific config that matches the working local script configuration

export function getFirebaseConfig() {
  // Sanitize the app ID by removing any newlines or carriage returns
  const sanitizeValue = (value) => {
    if (!value) return value;
    return value.replace(/[\r\n]/g, '');
  };
  
  return {
    apiKey: sanitizeValue(process.env.BACKEND_FIREBASE_API_KEY),
    authDomain: sanitizeValue(process.env.BACKEND_FIREBASE_AUTH_DOMAIN),
    projectId: sanitizeValue(process.env.BACKEND_FIREBASE_PROJECT_ID),
    storageBucket: sanitizeValue(process.env.BACKEND_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: sanitizeValue(process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID),
    appId: sanitizeValue(process.env.BACKEND_FIREBASE_APP_ID)
  };
}

export function getEmailConfig() {
  // Sanitize email credentials
  const sanitizeValue = (value) => {
    if (!value) return value;
    return value.replace(/[\r\n]/g, '');
  };
  
  return {
    user: sanitizeValue(process.env.EMAIL_USER),
    pass: sanitizeValue(process.env.EMAIL_PASSWORD)
  };
}

export function debugEnvironment() {
  // Safely debug environment variables
  const sanitizeValue = (value) => {
    if (!value) return false;
    return !!value.replace(/[\r\n]/g, '');
  };
  
  // Try to get values from multiple possible environment variable names
  const getEnvValue = (keys) => {
    for (const key of keys) {
      if (process.env[key]) return sanitizeValue(process.env[key]);
    }
    return false;
  };
  
  return {
    firebase: {
      apiKey: sanitizeValue(process.env.BACKEND_FIREBASE_API_KEY),
      authDomain: getEnvValue(['BACKEND_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN']),
      projectId: getEnvValue(['BACKEND_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID']),
      storageBucket: getEnvValue(['BACKEND_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET']),
      messagingSenderId: sanitizeValue(process.env.BACKEND_FIREBASE_MESSAGING_SENDER_ID),
      appId: sanitizeValue(process.env.BACKEND_FIREBASE_APP_ID)
    },
    email: {
      user: sanitizeValue(process.env.EMAIL_USER),
      pass: sanitizeValue(process.env.EMAIL_PASSWORD)
    },
    nodeEnv: process.env.NODE_ENV ? process.env.NODE_ENV.replace(/[\r\n]/g, '') : undefined,
    vercel: !!process.env.VERCEL
  };
}
