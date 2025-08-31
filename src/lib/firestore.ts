import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  runTransaction,
  writeBatch,
  increment,
} from "firebase/firestore";
import { app } from "./firebase";
import type { Product, UserProfile, Order } from "./types";

const db = getFirestore(app);
const productsCollection = collection(db, "products");
const usersCollection = collection(db, "users");
const ordersCollection = collection(db, "orders");


// GET all products
export async function getProducts(): Promise<Product[]> {
  const querySnapshot = await getDocs(productsCollection);
  const products: Product[] = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  return products;
}

// ADD a new product
export async function addProduct(
  productData: Omit<Product, "id" | "historicalData">
): Promise<Product> {
  const docRef = await addDoc(productsCollection, {
    ...productData,
    historicalData: JSON.stringify(
      [{ date: new Date().toISOString().split("T")[0], stock: productData.stock }],
      null,
      2
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...productData, id: docRef.id, historicalData: "[]" };
}

// UPDATE a product
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id">>
): Promise<void> {
  const productDoc = doc(db, "products", productId);
  await updateDoc(productDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE a product
export async function deleteProduct(productId: string): Promise<void> {
  const productDoc = doc(db, "products", productId);
  await deleteDoc(productDoc);
}

// ADD a new user profile
export async function addUser(userData: UserProfile): Promise<void> {
  const userDoc = doc(db, "users", userData.uid);
  await setDoc(userDoc, {
    ...userData,
    createdAt: serverTimestamp(),
  });
}

// GET user profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = doc(db, "users", uid);
  const docSnap = await getDoc(userDoc);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

// ADD a new order and decrease stock
export async function addOrderAndDecreaseStock(orderData: Omit<Order, "id">): Promise<Order> {
  const newOrderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (transaction) => {
    // 1. Create the new order
    transaction.set(newOrderRef, { ...orderData, updatedAt: serverTimestamp() });

    // 2. Decrease stock for each item in the order
    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${item.productId} does not exist.`);
      }

      const currentStock = productDoc.data().stock;
      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
      
      const newStock = currentStock - item.quantity;
      transaction.update(productRef, { stock: newStock });
    }
  });
  
  return { ...orderData, id: newOrderRef.id };
}
