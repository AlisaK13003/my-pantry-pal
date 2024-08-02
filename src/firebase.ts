import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAali0FngChaNv1MpqMDqOFp03lET0ztXg",
  authDomain: "inventory-management-26206.firebaseapp.com",
  projectId: "inventory-management-26206",
  storageBucket: "inventory-management-26206.appspot.com",
  messagingSenderId: "673430879548",
  appId: "1:673430879548:web:fd0ea57725b6e3f4927239",
  measurementId: "G-K6JDJBRGJL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
