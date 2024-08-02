import { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, QuerySnapshot, DocumentData, Query } from "firebase/firestore";

interface InventoryItem {
  name: string;
  quantity?: number;
}

const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const updateInventory = async () => {
    const inventoryQuery: Query<DocumentData> = query(collection(firestore, 'inventory'));
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(inventoryQuery);
    const inventoryList: InventoryItem[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      inventoryList.push({
        name: doc.id,
        quantity: typeof data.quantity === 'number' && !isNaN(data.quantity) ? data.quantity : 1,
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item: string): Promise<void> => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const quantity = typeof data.quantity === 'number' && !isNaN(data.quantity) ? data.quantity : 0;
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item: string): Promise<void> => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const quantity = typeof data.quantity === 'number' && !isNaN(data.quantity) ? data.quantity : 1;
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  return {
    inventory,
    addItem,
    removeItem,
    updateInventory,
  };
};

export default useInventory;
