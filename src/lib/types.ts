export interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  historicalData: string;
  category?: string;
  cost?: number;
  description?: string;
  images?: string[];
  origin?: string;
  originalPrice?: number;
  popularity?: number;
  price?: number;
  status?: 'active' | 'inactive';
  subcategory?: string;
  supplierId?: string;
  supplierName?: string | null;
  weight?: string;
  createdAt?: any; // Using `any` for Firebase Timestamp flexibility
  updatedAt?: any; // Using `any` for Firebase Timestamp flexibility
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'inventory-manager';
  createdAt?: any;
}

export interface OrderItem {
  productId: string;
  name: string;
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
  id?: string;
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
}
