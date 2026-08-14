import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
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

const getFirebaseEnv = (name: string) => process.env[name] || '';

const firebaseConfig = {
  apiKey: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (typeof window !== 'undefined' && missingFirebaseConfig.length > 0) {
  throw new Error(
    `Missing Firebase environment configuration: ${missingFirebaseConfig.join(', ')}`
  );
}

export interface InventoryItem {
  itemId: string;
  date: Timestamp; // Using Timestamp instead of string for date type
  type: string;
  quantity: number;
}

const app = typeof window === 'undefined' ? null : initializeApp(firebaseConfig);
const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
const db = app ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

export const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Create user document in Firestore using Timestamp for date
  await setDoc(doc(db, 'users', uid), {
    email: email,
    createdAt: Timestamp.fromDate(new Date()) // Convert to Timestamp
  });

  return userCredential;
};

export const signIn = async (email: string, password: string) => {
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
};

export const logOut = async () => {
  await signOut(auth);
};

function capitalizeWords(input: string): string {
  return input.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}


export const addItemToInventory = async (uid: string, date: Date, type: string, quantity: number) => {
  const userCollection = collection(db, `users/${uid}/inventory`);
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

    await updateDoc(doc(db, `users/${uid}/inventory/${existingItemDoc.id}`), {
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
  const itemDoc = doc(db, `users/${uid}/inventory/${itemId}`);
  await deleteDoc(itemDoc);
};

export const editItemInInventory = async (uid: string, itemId: string, newType: string, newQuantity: number) => {
  const itemDoc = doc(db, `users/${uid}/inventory/${itemId}`);
  await updateDoc(itemDoc, {
    type: newType,
    quantity: newQuantity,
    updatedAt: Timestamp.now() // Use Timestamp here
  });
};

export const getUserInventory = async (uid: string): Promise<InventoryItem[]> => {
  const userCollection = collection(db, `users/${uid}/inventory`);
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
