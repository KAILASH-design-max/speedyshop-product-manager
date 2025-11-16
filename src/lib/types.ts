export interface ProductVariant {
  id: string; // e.g., "prod_001-small-red"
  name: string; // e.g., "Small, Red"
  stock: number;
  price: number;
  lowStockThreshold: number;
  sku?: string;
  originalPrice?: number;
  weight?: string;
}

export interface Product {
  id: string;
  name: string;
  isVariable: boolean;
  variants: ProductVariant[];
  description?: string;
  category?: string;
  images?: string[];
  origin?: string;
  popularity?: number;
  status?: 'active' | 'inactive';
  subcategory?: string;
  supplierId?: string;
  createdAt?: any; // Using `any` for Firebase Timestamp flexibility
  updatedAt?: any; // Using `any` for Firebase Timestamp flexibility
  // Fields moved to variant: stock, price, lowStockThreshold, originalPrice, weight
  stock?: number; // Kept for backwards compatibility / simple products if needed, but logic moves to variants
  price?: number; // Kept for backwards compatibility
  lowStockThreshold?: number; // Kept for backwards compatibility
  historicalData: string; // This will now need to aggregate data from all variants
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'inventory-manager';
  createdAt?: any;
  updatedAt?: any;
  photoURL?: string;
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  status?: 'active' | 'inactive';
}

export interface OrderItem {
  productId: string;
  variantId: string; // New: to identify the specific variant
  name: string; // Will now be "Product Name (Variant Name)"
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  deliveryCharge?: number;
  discountAmount?: number;
  gstAmount?: number;
  handlingCharge?: number;
  surgeCharge?: number;
  tipAmount?: number;
  promoCodeApplied?: string | null;
  noContactDelivery?: boolean;
  deliveryInstructions?: string;
  deliveryPartnerId?: string;
  estimatedDeliveryTime?: any; // Firebase Timestamp
  phoneNumber?: string;
  updatedAt?: any; // Firebase Timestamp
  createdAt?: any; // Using `any` for Firebase Timestamp flexibility
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: any;
}

export interface Festival {
  id: string;
  title: string;
  startDate: any; // Firebase Timestamp
  endDate: any; // Firebase Timestamp
  productIds: string[];
  urlSlug: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Deal {
  id: string;
  title: string;
  startDate: any; // Firebase Timestamp
  endDate: any; // Firebase Timestamp
  productIds: string[];
  urlSlug: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface PurchaseOrderItem {
  productId: string;
  variantId: string; // New
  name: string; // Will now be "Product Name (Variant Name)"
  quantity: number;
  costPerItem: number;
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    items: PurchaseOrderItem[];
    status: 'Pending' | 'Received';
    totalCost: number;
    createdAt: any; // Firebase Timestamp
    receivedAt?: any; // Firebase Timestamp
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'low-stock' | 'new-order' | 'info';
  isRead: boolean;
  createdAt: any; // Firebase Timestamp
  link?: string; // Optional link to navigate to
}
