import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBXHW6OaNvaxIi5-642ndxyuX6UL6ypU88",
    authDomain: "todo-app-17ff9.firebaseapp.com",
    projectId: "todo-app-17ff9",
    storageBucket: "todo-app-17ff9.firebasestorage.app",
    messagingSenderId: "340723500590",
    appId: "1:340723500590:web:33f086e3d25045ebb001bf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);