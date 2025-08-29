// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN1zAZsbo6_HDcFNVRvXekmY_JdTF4M3U",
  authDomain: "ai-app-bb63d.firebaseapp.com",
  databaseURL: "https://ai-app-bb63d-default-rtdb.firebaseio.com",
  projectId: "ai-app-bb63d",
  storageBucket: "ai-app-bb63d.firebasestorage.app",
  messagingSenderId: "511120628966",
  appId: "1:511120628966:web:d4a1504e1252f74bcfaf27",
  measurementId: "G-8QVLZG13R3"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

export { app };
