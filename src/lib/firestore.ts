import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "./firebase";
import type { Product } from "./types";

const db = getFirestore(app);
const productsCollection = collection(db, "products");

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
