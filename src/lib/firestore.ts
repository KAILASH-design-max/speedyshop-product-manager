
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
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
} from "firebase/firestore";
import { app } from "./firebase";
import type { Product, UserProfile, Order, Notification, Supplier, Festival } from "./types";

const db = getFirestore(app);
const productsCollection = collection(db, "products");
const usersCollection = collection(db, "users");
const ordersCollection = collection(db, "orders");
const notificationsCollection = collection(db, "notifications");
const suppliersCollection = collection(db, "suppliers");
const festivalsCollection = collection(db, "festivals");


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
  
  if (updates.stock !== undefined) {
    const productSnapshot = await getDoc(productDoc);
    const productData = productSnapshot.data() as Product;
    
    if (productData.stock > (productData.lowStockThreshold || 0) && updates.stock <= (productData.lowStockThreshold || 0)) {
      await addNotification({
        title: "Low Stock Alert",
        description: `Stock for ${productData.name} is low (${updates.stock} left).`,
        type: 'low-stock',
        isRead: false,
        createdAt: serverTimestamp(),
        link: `/products/${productId}`
      });
    }
  }

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

// UPDATE user profile
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, "id">>
): Promise<void> {
  const userDoc = doc(db, "users", uid);
  await updateDoc(userDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}


// GET all orders
export async function getOrders(): Promise<Order[]> {
  const querySnapshot = await getDocs(ordersCollection);
  const orders: Order[] = [];
  querySnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  return orders;
}

// ADD a new order and decrease stock
export async function addOrderAndDecreaseStock(orderData: Omit<Order, "id">): Promise<Order> {
  const newOrderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (transaction) => {
    // 1. Create the new order
    transaction.set(newOrderRef, { ...orderData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
     await addNotification({
        title: "New Order Received",
        description: `Order #${newOrderRef.id.substring(0,6)} for a total of $${orderData.totalAmount} has been placed.`,
        type: 'new-order',
        isRead: false,
        createdAt: serverTimestamp(),
        link: `/orders/${newOrderRef.id}`
      });

    // 2. Decrease stock for each item in the order
    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${item.productId} does not exist.`);
      }

      const productData = productDoc.data();
      const currentStock = productData.stock;
      
      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
      
      const newStock = currentStock - item.quantity;
      transaction.update(productRef, { stock: newStock });
      
      // Check for low stock after transaction
      if (productData.lowStockThreshold && currentStock > productData.lowStockThreshold && newStock <= productData.lowStockThreshold) {
         await addNotification({
            title: "Low Stock Alert",
            description: `Stock for ${productData.name} is low (${newStock} left) due to a new order.`,
            type: 'low-stock',
            isRead: false,
            createdAt: serverTimestamp(),
            link: `/products/${productData.id}`
        });
      }
    }
  });
  
  return { ...orderData, id: newOrderRef.id };
}


// NOTIFICATIONS
export async function addNotification(notificationData: Omit<Notification, "id">): Promise<Notification> {
  const docRef = await addDoc(notificationsCollection, notificationData);
  return { ...notificationData, id: docRef.id } as Notification;
}

export function getNotifications(callback: (notifications: Notification[]) => void): () => void {
  const q = query(notificationsCollection, orderBy("createdAt", "desc"), limit(20));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    callback(notifications);
  });
  
  return unsubscribe;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationDoc = doc(db, "notifications", notificationId);
  await updateDoc(notificationDoc, { isRead: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const q = query(notificationsCollection, where("isRead", "==", false));
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });
  
  await batch.commit();
}

// SUPPLIERS
export async function getSuppliers(): Promise<Supplier[]> {
  const querySnapshot = await getDocs(suppliersCollection);
  const suppliers: Supplier[] = [];
  querySnapshot.forEach((doc) => {
    suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
  });
  return suppliers;
}

export async function addSupplier(supplierData: Omit<Supplier, "id">): Promise<Supplier> {
  const docRef = await addDoc(suppliersCollection, {
    ...supplierData,
    createdAt: serverTimestamp(),
  });
  return { ...supplierData, id: docRef.id };
}

export async function updateSupplier(supplierId: string, updates: Partial<Omit<Supplier, "id">>): Promise<void> {
  const supplierDoc = doc(db, "suppliers", supplierId);
  await updateDoc(supplierDoc, updates);
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const supplierDoc = doc(db, "suppliers", supplierId);
  await deleteDoc(supplierDoc);
}

// FESTIVALS
export async function getFestivals(): Promise<Festival[]> {
  const q = query(festivalsCollection, orderBy("isActive", "desc"), orderBy("startDate", "desc"));
  const querySnapshot = await getDocs(q);
  const festivals: Festival[] = [];
  querySnapshot.forEach((doc) => {
    festivals.push({ id: doc.id, ...doc.data() } as Festival);
  });
  return festivals;
}

export async function addFestival(festivalData: Omit<Festival, "id">): Promise<Festival> {
  const docRef = await addDoc(festivalsCollection, {
    ...festivalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...festivalData, id: docRef.id };
}

export async function updateFestival(festivalId: string, updates: Partial<Omit<Festival, "id">>): Promise<void> {
  const festivalDoc = doc(db, "festivals", festivalId);
  await updateDoc(festivalDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFestival(festivalId: string): Promise<void> {
  const festivalDoc = doc(db, "festivals", festivalId);
  await deleteDoc(festivalDoc);
}
