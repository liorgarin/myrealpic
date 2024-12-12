import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use the same configuration as in your Expo app
const firebaseConfig = {
  apiKey: "AIzaSyC3AxMaDWQv1S-453f3rSq0SsrBNHrchEo",
  authDomain: "myrealpic-2fdba.firebaseapp.com",
  projectId: "myrealpic-2fdba",
  storageBucket: "myrealpic-2fdba.firebasestorage.app",
  messagingSenderId: "592441394251",
  appId: "1:592441394251:web:97bc5f534af9bbda2179ce",
  measurementId: "G-R1YZH6D00B",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// For web, just use the standard getAuth
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };