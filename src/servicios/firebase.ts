import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyCg_wMszMGLsk8kjaUc3VSlMlRTiHEwziI",
  authDomain: "megatom-project.firebaseapp.com",
  projectId: "megatom-project",
  storageBucket: "megatom-project.firebasestorage.app",
  messagingSenderId: "6898475140",
  appId: "1:6898475140:web:486b7c7124be84deeda2d1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
