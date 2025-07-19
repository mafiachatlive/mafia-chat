import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPhoneNumber, signInWithEmailLink, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3qEXB3nh8CHCTQ2PBPLA-CgUDLyN0f4M",
  authDomain: "mafiachatlive.firebaseapp.com",
  databaseURL: "https://mafiachatlive-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mafiachatlive",
  storageBucket: "mafiachatlive.firebasestorage.app",
  messagingSenderId: "55960118949",
  appId: "1:55960118949:web:ad5130885158c13faf8f4c",
  measurementId: "G-F7NZP2BBMG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
