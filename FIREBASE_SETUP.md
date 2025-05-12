# Firebase Setup Guide

This guide will help you set up Firebase Firestore for storing user data in your Free Fire Arena application.

## Prerequisites

1. A Google account
2. A Firebase project (already created with the following config):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your Firebase API Key, preferably using environment variables.
     authDomain: "YOUR_FIREBASE_AUTH_DOMAIN", // Replace with your Firebase Auth Domain, preferably using environment variables.
     projectId: "YOUR_FIREBASE_PROJECT_ID", // Replace with your Firebase Project ID, preferably using environment variables.
     storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET", // Replace with your Firebase Storage Bucket, preferably using environment variables.
     messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID", // Replace with your Firebase Messaging Sender ID, preferably using environment variables.
     appId: "YOUR_FIREBASE_APP_ID" // Replace with your Firebase App ID, preferably using environment variables.
   };
   ```

## Setup Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in your project

```bash
firebase init
```

Select the following options:
- Select "Firestore" and "Storage"
- Select your existing project
- Accept the default rules file locations
- Say NO to overwriting existing files if prompted

### 4. Deploy Firestore Rules

This project already has a `firestore.rules` file. Deploy it with:

```bash
firebase deploy --only firestore:rules
```

### 5. Create Firestore Database Structure

Navigate to the Firebase Console and create the following collection structure:

#### Users Collection

Each document in the users collection should have the following fields:

| Field Name | Type | Description |
|------------|------|-------------|
| id | string | Firebase Auth UID |
| uid | string | Free Fire UID |
| ign | string | Free Fire In-Game Name |
| fullName | string | User's full name |
| email | string | User's email address |
| phone | string | User's phone number |
| bio | string | User's bio/description |
| location | string | User's location |
| birthdate | string | User's birthdate |
| gender | string | User's gender |
| avatar_url | string/null | URL to user's profile picture |
| isPremium | boolean | Whether user has premium status |
| created_at | timestamp | When the profile was created |
| updated_at | timestamp | When the profile was last updated |

### 6. Firebase Authentication Setup

#### Enable Authentication Methods

1. Go to Firebase Console > Authentication > Sign-in Method
2. Enable Email/Password authentication
3. Enable Google authentication

### 7. Firebase Storage Setup

Enable Firebase Storage for storing user avatars:

1. Go to Firebase Console > Storage
2. Set up storage rules to match the following:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Deploy the storage rules:

```bash
firebase deploy --only storage:rules
```

### 8. Testing Your Setup

After completing the setup, test the following functionality:

1. User Registration
2. User Login
3. Profile Creation and Updates
4. Avatar Upload

## Firestore Data Structure Details

### User Document

```javascript
{
  id: "firebase-auth-user-id",
  uid: "FF123456789",        // Free Fire UID
  ign: "PlayerName123",      // In-game name
  fullName: "John Smith",
  email: "user@example.com",
  phone: "+1234567890",
  bio: "I am a passionate gamer...",
  location: "New York, USA",
  birthdate: "1995-07-15",
  gender: "male",
  avatar_url: "https://example.com/avatar.jpg", // or null
  isPremium: false,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

## Common Issues and Solutions

### Security Rules

If you're experiencing permission issues, make sure:

1. The user is authenticated (signed in)
2. The user is trying to access their own data
3. Your security rules are properly deployed

### Timestamps

When working with timestamps:

1. Use `serverTimestamp()` for all writes
2. Use `.toDate()` when reading timestamps for UI display 