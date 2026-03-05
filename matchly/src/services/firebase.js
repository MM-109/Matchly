import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB9DP3BbSf7ZSIXZWz01i9yV6hbHgQ5_MI",
  authDomain: "matchly-186f2.firebaseapp.com",
  projectId: "matchly-186f2",
  storageBucket: "matchly-186f2.appspot.com",
  messagingSenderId: "860172283445",
  appId: "1:860172283445:web:c04ec8a74625efe2b08b7c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);