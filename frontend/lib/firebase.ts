// Firebase configuration and initialization
// Note: In a real application, you would install firebase SDK and configure it properly

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Mock Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "paperparser-app.firebaseapp.com",
  projectId: "paperparser-app",
  storageBucket: "paperparser-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
}

// Mock Firebase services
export const auth = {
  signInWithPopup: async (provider: any) => {
    // Mock Google sign-in
    return {
      user: {
        uid: "mock-user-id",
        displayName: "John Doe",
        email: "john@example.com",
        photoURL: "/placeholder.svg?height=40&width=40",
      },
    }
  },
  signOut: async () => {
    // Mock sign out
    return Promise.resolve()
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Mock auth state listener
    return () => {}
  },
}

export const firestore = {
  collection: (path: string) => ({
    add: async (data: any) => {
      // Mock Firestore add
      return { id: `mock-doc-${Date.now()}` }
    },
    where: (field: string, operator: string, value: any) => ({
      orderBy: (field: string, direction: string) => ({
        get: async () => ({
          docs: [], // Mock empty results
        }),
      }),
    }),
  }),
}

export const storage = {
  ref: (path: string) => ({
    put: async (file: File) => {
      // Mock file upload
      return {
        ref: {
          getDownloadURL: async () => `https://mock-storage-url.com/${file.name}`,
        },
      }
    },
    getDownloadURL: async () => "https://mock-download-url.com",
  }),
}

// Mock Google Auth Provider
export const GoogleAuthProvider = {
  PROVIDER_ID: "google.com",
}

export default firebaseConfig
