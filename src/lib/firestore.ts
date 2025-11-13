
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
import type { Product, UserProfile, Order, Supplier, Festival, PurchaseOrder, Notification } from "./types";

const db = getFirestore(app);
const productsCollection = collection(db, "products");
const usersCollection = collection(db, "users");
const ordersCollection = collection(db, "orders");
const suppliersCollection = collection(db, "suppliers");
const festivalsCollection = collection(db, "festivals");
const purchaseOrdersCollection = collection(db, "purchaseOrders");
const notificationsCollection = collection(db, "notifications");


// NOTIFICATIONS
export async function addNotification(notificationData: Omit<Notification, "id" | "createdAt" | "isRead">) {
  await addDoc(notificationsCollection, {
    ...notificationData,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export function getNotifications(callback: (notifications: Notification[]) => void) {
  const q = query(notificationsCollection, orderBy("createdAt", "desc"), limit(20));
  return onSnapshot(q, (querySnapshot) => {
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    callback(notifications);
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationDoc = doc(db, "notifications", notificationId);
  await updateDoc(notificationDoc, { isRead: true });
}

export async function markAllNotificationsAsRead() {
    const q = query(notificationsCollection, where("isRead", "==", false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}


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

  if (productData.stock <= productData.lowStockThreshold) {
      await addNotification({
          title: "Low Stock Warning",
          description: `${productData.name} was added with low stock (${productData.stock} left).`,
          type: "low-stock",
          link: `/`, 
      });
  }

  return { ...productData, id: docRef.id, historicalData: "[]" };
}

// UPDATE a product
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id">>
): Promise<void> {
  const productDoc = doc(db, "products", productId);
  
  if (updates.stock !== undefined && updates.lowStockThreshold !== undefined) {
    if (updates.stock <= updates.lowStockThreshold) {
        const product = await getDoc(productDoc);
        if(product.exists()){
            await addNotification({
                title: "Low Stock Warning",
                description: `${product.data().name} is running low on stock (${updates.stock} left).`,
                type: "low-stock",
                link: `/`,
            });
        }
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
    return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
}

// UPDATE user profile (by the user themselves)
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

// GET all users (admin only)
export async function getAllUsers(): Promise<UserProfile[]> {
  const querySnapshot = await getDocs(usersCollection);
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ uid: doc.id, ...doc.data() } as UserProfile);
  });
  return users;
}

// UPDATE user profile (by an admin)
export async function adminUpdateUser(
  uid: string,
  updates: Pick<UserProfile, 'role' | 'status'>
): Promise<void> {
  const userDoc = doc(db, "users", uid);
  await updateDoc(userDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}


// GET all orders
export async function getOrders(): Promise<Order[]> {
    const q = query(ordersCollection, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
}

// UPDATE an order's status
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
        status: status,
        updatedAt: serverTimestamp(),
    });

    await addNotification({
      title: "Order Status Updated",
      description: `Order #${orderId.substring(0,6)} is now "${status}".`,
      type: "info",
      link: `/orders`,
    });
}

// ADD a new order and decrease stock
export async function addOrderAndDecreaseStock(orderData: Omit<Order, "id">): Promise<Order> {
  const newOrderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (transaction) => {
    // 1. Create the new order
    transaction.set(newOrderRef, { ...orderData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
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
      
    }
  });
  
  return { ...orderData, id: newOrderRef.id, ...orderData };
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

// PURCHASE ORDERS
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const q = query(purchaseOrdersCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const purchaseOrders: PurchaseOrder[] = [];
    querySnapshot.forEach((doc) => {
        purchaseOrders.push({ id: doc.id, ...doc.data() } as PurchaseOrder);
    });
    return purchaseOrders;
}

export async function addPurchaseOrder(poData: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    const docRef = await addDoc(purchaseOrdersCollection, {
        ...poData,
        createdAt: serverTimestamp(),
    });
    
    await addNotification({
      title: "New Purchase Order",
      description: `A new PO has been created (Total: ${poData.totalCost}).`,
      type: "new-order",
      link: `/purchase-orders`,
    });

    return { ...poData, id: docRef.id };
}

export async function receivePurchaseOrder(purchaseOrder: PurchaseOrder): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const poRef = doc(db, "purchaseOrders", purchaseOrder.id);
        
        // 1. Update the PO status and received date
        transaction.update(poRef, { 
            status: 'Received',
            receivedAt: serverTimestamp() 
        });

        // 2. Increase stock for each item in the PO
        for (const item of purchaseOrder.items) {
            const productRef = doc(db, "products", item.productId);
            // Use Firestore's increment utility for safe, atomic updates
            transaction.update(productRef, { stock: increment(item.quantity) });
        }
    });

     await addNotification({
      title: "PO Received",
      description: `Purchase order #${purchaseOrder.id.substring(0,6)} has been received.`,
      type: "info",
      link: `/purchase-orders`,
    });
}
