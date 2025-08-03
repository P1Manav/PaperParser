// Install these packages: npm install firebase
import { initializeApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth"
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const firestore = getFirestore(app)
export const storage = getStorage(app)

// Auth functions
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    throw error
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Firestore functions
export const saveGenerationHistory = async (userId: string, data: any) => {
  try {
    const docRef = await addDoc(collection(firestore, "generations"), {
      userId,
      ...data,
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error saving generation history:", error)
    throw error
  }
}

export const getUserGenerations = async (userId: string) => {
  try {
    const q = query(collection(firestore, "generations"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching user generations:", error)
    throw error
  }
}

export const deleteGeneration = async (generationId: string) => {
  try {
    await deleteDoc(doc(firestore, "generations", generationId))
  } catch (error) {
    console.error("Error deleting generation:", error)
    throw error
  }
}

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

export const generateContent = async () => {
  // This function is a placeholder. The actual implementation should be in the backend.
  console.warn(
    "generateContent function in lib/firebase.ts is a placeholder. The actual implementation should be in the backend.",
  )
  return Promise.resolve({ downloadUrl: "" })
}

// Export the onAuthStateChanged function properly
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback)
}
