import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage"; 

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6wJNhU8OA_FFhSruI-Kxo6Z9J1H-jMY0",
  authDomain: "algogram-471ba.firebaseapp.com",
  projectId: "algogram-471ba",
  storageBucket: "algogram-471ba.firebasestorage.app",
  messagingSenderId: "825756812399",
  appId: "1:825756812399:web:9b7583e74f73531957399a",
  measurementId: "G-1T2E0YZDG5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// export default app;