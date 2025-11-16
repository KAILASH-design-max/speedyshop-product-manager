
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
  arrayUnion,
} from "firebase/firestore";
import { app } from "./firebase";
import type { Product, UserProfile, Order, Supplier, Festival, PurchaseOrder, Notification, Deal } from "./types";

const db = getFirestore(app);
const productsCollection = collection(db, "products");
const usersCollection = collection(db, "users");
const ordersCollection = collection(db, "orders");
const suppliersCollection = collection(db, "suppliers");
const festivalsCollection = collection(db, "festivals");
const dealsCollection = collection(db, "deals");
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
  const totalStock = productData.variants.reduce((sum, v) => sum + v.stock, 0);

  const docRef = await addDoc(productsCollection, {
    ...productData,
    historicalData: JSON.stringify(
      [{ date: new Date().toISOString().split("T")[0], stock: totalStock }],
      null,
      2
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const variant of productData.variants) {
      if (variant.stock <= variant.lowStockThreshold) {
          await addNotification({
              title: "Low Stock Warning",
              description: `${productData.name} (${variant.name}) was added with low stock (${variant.stock} left).`,
              type: "low-stock",
              link: `/`, 
          });
      }
  }

  return { ...productData, id: docRef.id, historicalData: "[]" };
}

// UPDATE a product
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id">>
): Promise<void> {
  const productDocRef = doc(db, "products", productId);

  // If variants are being updated, check for low stock on each variant
  if (updates.variants) {
    const productDoc = await getDoc(productDocRef);
    if (productDoc.exists()) {
      const productName = productDoc.data().name;
      for (const variant of updates.variants) {
        if (variant.stock <= variant.lowStockThreshold) {
          await addNotification({
            title: "Low Stock Warning",
            description: `${productName} (${variant.name}) is running low on stock (${variant.stock} left).`,
            type: "low-stock",
            link: `/`,
          });
        }
      }
    }
  }
  
  await updateDoc(productDocRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE a product
export async function deleteProduct(productId: string): Promise<void> {
  const productDoc = doc(db, "products", productId);
  await deleteDoc(productDoc);
}


export async function bulkDeleteProducts(productIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    productIds.forEach(id => {
        const productDoc = doc(db, "products", id);
        batch.delete(productDoc);
    });
    await batch.commit();
}


export async function bulkUpdateProducts(
    productIds: string[],
    updateType: 'deal' | 'festival',
    targetId: string
): Promise<void> {
    const batch = writeBatch(db);
    const targetCollection = updateType === 'deal' ? 'deals' : 'festivals';
    const targetDocRef = doc(db, targetCollection, targetId);

    // This is a simplified approach. A more robust solution might need to
    // read the doc first if it has to handle complex array logic,
    // but for just adding product IDs, arrayUnion is efficient.
    batch.update(targetDocRef, {
        productIds: arrayUnion(...productIds)
    });
    
    await batch.commit();
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

      const productData = productDoc.data() as Product;
      const variantIndex = productData.variants.findIndex(v => v.id === item.variantId);
      
      if (variantIndex === -1) {
          throw new Error(`Variant with ID ${item.variantId} not found in product ${item.productId}`);
      }

      const currentStock = productData.variants[variantIndex].stock;
      
      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
      
      const newVariants = [...productData.variants];
      newVariants[variantIndex].stock -= item.quantity;
      
      transaction.update(productRef, { variants: newVariants });
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

// DEALS
export async function getDeals(): Promise<Deal[]> {
  const q = query(dealsCollection, orderBy("isActive", "desc"), orderBy("startDate", "desc"));
  const querySnapshot = await getDocs(q);
  const deals: Deal[] = [];
  querySnapshot.forEach((doc) => {
    deals.push({ id: doc.id, ...doc.data() } as Deal);
  });
  return deals;
}

export async function addDeal(dealData: Omit<Deal, "id">): Promise<Deal> {
  const docRef = await addDoc(dealsCollection, {
    ...dealData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...dealData, id: docRef.id };
}

export async function updateDeal(dealId: string, updates: Partial<Omit<Deal, "id">>): Promise<void> {
  const dealDoc = doc(db, "deals", dealId);
  await updateDoc(dealDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDeal(dealId: string): Promise<void> {
  const dealDoc = doc(db, "deals", dealId);
  await deleteDoc(dealDoc);
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
    const productRefs = new Map<string, { productRef: any, productDoc?: any }>();
    
    // Pre-fetch all unique product documents
    const uniqueProductIds = [...new Set(purchaseOrder.items.map(item => item.productId))];
    for (const productId of uniqueProductIds) {
      const productRef = doc(db, "products", productId);
      productRefs.set(productId, { productRef });
    }

    const productDocs = await transaction.getAll(...Array.from(productRefs.values()).map(p => p.productRef));
    productDocs.forEach(productDoc => {
        if(productDoc.exists()) {
            const ref = productRefs.get(productDoc.id);
            if(ref) ref.productDoc = productDoc;
        }
    });

    // Group updates by product ID
    const stockUpdates = new Map<string, any[]>();
    for (const item of purchaseOrder.items) {
      if (!stockUpdates.has(item.productId)) {
        stockUpdates.set(item.productId, []);
      }
      stockUpdates.get(item.productId)!.push({ variantId: item.variantId, quantity: item.quantity });
    }

    // Apply updates
    for (const [productId, updates] of stockUpdates.entries()) {
      const ref = productRefs.get(productId);
      if (!ref || !ref.productDoc) {
        throw new Error(`Product with ID ${productId} not found during transaction.`);
      }

      const productData = ref.productDoc.data() as Product;
      const newVariants = [...productData.variants];

      for (const update of updates) {
        const variantIndex = newVariants.findIndex(v => v.id === update.variantId);
        if (variantIndex !== -1) {
          newVariants[variantIndex].stock += update.quantity;
        } else {
          // Handle case where variant is not found, maybe throw error or log
          console.warn(`Variant ${update.variantId} not found on product ${productId} during PO reception.`);
        }
      }
      transaction.update(ref.productRef, { variants: newVariants });
    }
  });

  await addNotification({
    title: "PO Received",
    description: `Purchase order #${purchaseOrder.id.substring(0,6)} has been received.`,
    type: "info",
    link: `/purchase-orders`,
  });
}
