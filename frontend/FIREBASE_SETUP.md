# Firebase Setup Guide for PaperParser

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `paperparser`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains

## Step 3: Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users

## Step 4: Set up Firebase Storage

1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select the same location as Firestore

## Step 5: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register app with name "PaperParser"
5. Copy the configuration object

## Step 6: Update Environment Variables

Update your `.env.local` file with the Firebase configuration:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
\`\`\`

## Step 7: Install Firebase SDK

\`\`\`bash
npm install firebase
\`\`\`

## Step 8: Security Rules (Production)

### Firestore Rules:
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /generations/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
\`\`\`

### Storage Rules:
\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /outputs/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## Step 9: Test the Setup

1. Start your Next.js development server
2. Try signing in with Google
3. Upload a PDF file
4. Check Firebase Console to see if data is being stored

## Firestore Collections Structure

### `generations` collection:
\`\`\`javascript
{
  id: "auto-generated",
  userId: "user-uid",
  type: "podcast" | "presentation",
  title: "Document title",
  originalFileName: "document.pdf",
  originalFileUrl: "firebase-storage-url",
  downloadUrl: "backend-generated-url",
  status: "completed" | "processing" | "failed",
  settings: {
    voice: "sarah",
    length: "medium",
    // ... other settings
  },
  createdAt: timestamp,
  duration: "15:30", // for podcasts
  slides: 12 // for presentations
}
\`\`\`

## Storage Structure

\`\`\`
/uploads/{userId}/{timestamp}_{filename}.pdf
/outputs/{userId}/{generated-files}
