export interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  historicalData: string;
  // Optional fields from user data
  category?: string;
  cost?: number;
  description?: string;
  images?: string[];
  origin?: string;
  originalPrice?: number;
  popularity?: number;
  price?: number;
  status?: string;
  subcategory?: string;
  supplierId?: string;
  supplierName?: string | null;
  weight?: string;
  createdAt?: any; // Using `any` for Firebase Timestamp flexibility
  updatedAt?: any; // Using `any` for Firebase Timestamp flexibility
}
