import { initializeApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  Timestamp // Import Timestamp for handling date fields
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

export interface InventoryItem {
  itemId: string;
  date: Timestamp; // Using Timestamp instead of string for date type
  type: string;
  quantity: number;
}

const app = typeof window !== 'undefined' && isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const requireAuth = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }

  return auth;
};

const requireDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  return db;
};

export const signUp = async (email: string, password: string) => {
  const firebaseAuth = requireAuth();
  const firestore = requireDb();
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const uid = userCredential.user.uid;

  // Create user document in Firestore using Timestamp for date
  await setDoc(doc(firestore, 'users', uid), {
    email: email,
    createdAt: Timestamp.fromDate(new Date()) // Convert to Timestamp
  });

  return userCredential;
};

export const signIn = async (email: string, password: string) => {
  const firebaseAuth = requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return userCredential;
};

export const logOut = async () => {
  await signOut(requireAuth());
};

function capitalizeWords(input: string): string {
  return input.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}


export const addItemToInventory = async (uid: string, date: Date, type: string, quantity: number) => {
  const firestore = requireDb();
  const userCollection = collection(firestore, `users/${uid}/inventory`);
  const dateAsTimestamp = Timestamp.fromDate(date); // Convert Date to Timestamp
  const formattedType = capitalizeWords(type); // Capitalize and format the type string

  // Check if an item with the same type already exists
  const q = query(userCollection, where('type', '==', formattedType));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // If item exists, update the existing item's quantity
    const existingItemDoc = querySnapshot.docs[0];
    const existingItemData = existingItemDoc.data();
    const newQuantity = existingItemData.quantity + quantity;

    await updateDoc(doc(firestore, `users/${uid}/inventory/${existingItemDoc.id}`), {
      quantity: newQuantity,
      updatedAt: Timestamp.now(), // Use Timestamp here
      type: formattedType // Ensure type is consistently formatted
    });

    return;
  }

  // If item does not exist, add new item with formatted type
  await addDoc(userCollection, {
    date: dateAsTimestamp,
    type: formattedType,
    quantity
  });
};

export const removeItemFromInventory = async (uid: string, itemId: string) => {
  const itemDoc = doc(requireDb(), `users/${uid}/inventory/${itemId}`);
  await deleteDoc(itemDoc);
};

export const editItemInInventory = async (uid: string, itemId: string, newType: string, newQuantity: number) => {
  const itemDoc = doc(requireDb(), `users/${uid}/inventory/${itemId}`);
  await updateDoc(itemDoc, {
    type: newType,
    quantity: newQuantity,
    updatedAt: Timestamp.now() // Use Timestamp here
  });
};

export const getUserInventory = async (uid: string): Promise<InventoryItem[]> => {
  const userCollection = collection(requireDb(), `users/${uid}/inventory`);
  const q = query(userCollection);
  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map(doc => ({
    itemId: doc.id,
    date: doc.data().date as Timestamp, // Cast to Timestamp
    type: doc.data().type,
    quantity: doc.data().quantity,
  })) as InventoryItem[];
  return items;
};

export { auth, db, signOut };
