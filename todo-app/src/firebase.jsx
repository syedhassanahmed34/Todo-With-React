// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (NEW project)
const firebaseConfig = {
    apiKey: "AIzaSyAyJtm86LJ_RMzZHCfe4v0iZHzPo7FEsE0",
    authDomain: "todo-with-react-40f29.firebaseapp.com",
    projectId: "todo-with-react-40f29",
    storageBucket: "todo-with-react-40f29.firebasestorage.app",
    messagingSenderId: "527957524818",
    appId: "1:527957524818:web:185480edfbed368b6d7a8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export commonly used Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
