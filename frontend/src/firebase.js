import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDKJHAAlo5ldd4wtZ6tNhnonAad9p37kA",
  authDomain: "saudi-job-f499b.firebaseapp.com",
  projectId: "saudi-job-f499b",
  storageBucket: "saudi-job-f499b.appspot.com",
  messagingSenderId: "314409349088",
  appId: "1:314409349088:web:e0f28e55e1c3d8988dcd71",
  measurementId: "G-0D8WTG23KT"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);