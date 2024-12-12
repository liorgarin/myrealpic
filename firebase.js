// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3AxMaDWQv1S-453f3rSq0SsrBNHrchEo",
  authDomain: "myrealpic-2fdba.firebaseapp.com",
  projectId: "myrealpic-2fdba",
  storageBucket: "myrealpic-2fdba.firebasestorage.app",
  messagingSenderId: "592441394251",
  appId: "1:592441394251:web:97bc5f534af9bbda2179ce",
  measurementId: "G-R1YZH6D00B",
};

// Debugging: Validate Firebase configuration
console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
let app;

try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully:", app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("Auth initialized successfully:", auth);
} catch (error) {
  console.error("Auth initialization error:", error);
  throw error;
}

// Initialize Firestore
let db;

try {
  db = getFirestore(app);
  console.log("Firestore initialized successfully:", db);
} catch (error) {
  console.error("Firestore initialization error:", error);
  throw error;
}

// Initialize Storage
let storage;

try {
  storage = getStorage(app);
  console.log("Storage initialized successfully:", storage);
} catch (error) {
  console.error("Storage initialization error:", error);
  throw error;
}

// Export Firebase utilities
export { auth, db, storage };

// Debugging: Verify exports
console.log("Auth initialized:", auth);
console.log("Firestore initialized:", db);
console.log("Storage initialized:", storage);