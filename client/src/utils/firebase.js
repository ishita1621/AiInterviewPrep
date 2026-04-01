import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewprep-d17ef.firebaseapp.com",
  projectId: "interviewprep-d17ef",
  storageBucket: "interviewprep-d17ef.firebasestorage.app",
  messagingSenderId: "1008405208602",
  appId: "1:1008405208602:web:620bd131f4853574fe3ba3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };