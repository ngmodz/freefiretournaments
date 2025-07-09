// Firebase configuration using environment variables or default values
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCPdJQGxSRF-2-_kFCGwgX-6xEB6bNJ-GI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "freefire-tournaments-ba2a6.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "freefire-tournaments-ba2a6",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "freefire-tournaments-ba2a6.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "404872808558",
  appId: process.env.FIREBASE_APP_ID || "1:404872808558:web:73d3bff7542bcb1d11381c"
}; 