"use client";

import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";

import type { Product, UserProfile } from "@/lib/types";
import {
  addProduct,
  deleteProduct,
  getProducts,
  getUserProfile,
  updateProduct,
} from "@/lib/firestore";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { AddProductDialog } from "@/components/add-product-dialog";
import { LowStockAlerts } from "./low-stock-alerts";
import { StockReportChart } from "./stock-report-chart";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductAlert } from "./delete-product-alert";
import { UpdateStockDialog } from "./update-stock-dialog";
import { StockForecastingDialog } from "./stock-forecasting-dialog";
import { useAuth } from "@/hooks/use-auth";

export function InventoryDashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [forecastingProduct, setForecastingProduct] = useState<Product | null>(null);

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const [productsFromDb, profile] = await Promise.all([
          getProducts(),
          getUserProfile(user.uid)
        ]);
        setProducts(productsFromDb);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleAddProduct = async (
    newProductData: Omit<Product, "id" | "historicalData">
  ) => {
    if (!hasWriteAccess) return;
    try {
      const newProduct = await addProduct(newProductData);
      setProducts((prev) => [...prev, newProduct]);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (!hasWriteAccess) return;
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!hasWriteAccess) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeletingProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!hasWriteAccess) return;
    const productToUpdate = products.find((p) => p.id === productId);
    if (!productToUpdate) return;

    try {
      const historicalData = JSON.parse(productToUpdate.historicalData || "[]");
      const newHistoricalData = [
        ...historicalData,
        { date: new Date().toISOString().split("T")[0], stock: newStock },
      ];

      const updatedProductData = {
        ...productToUpdate,
        stock: newStock,
        historicalData: JSON.stringify(newHistoricalData, null, 2),
      };

      await updateProduct(productId, {
        stock: newStock,
        historicalData: updatedProductData.historicalData,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProductData : p))
      );
      setUpdatingStockProduct(null);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Inventory</h1>
            {hasWriteAccess && (
              <AddProductDialog onAddProduct={handleAddProduct}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </AddProductDialog>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <LowStockAlerts products={products} />
            <StockReportChart products={products} />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">All Products</h2>
            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => setDeletingProduct(product)}
                    onUpdateStock={() => setUpdatingStockProduct(product)}
                    onForecast={() => setForecastingProduct(product)}
                    hasWriteAccess={hasWriteAccess}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          onUpdateProduct={handleUpdateProduct}
          open={!!editingProduct}
          onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <DeleteProductAlert
          product={deletingProduct}
          onDelete={() => handleDeleteProduct(deletingProduct.id)}
          open={!!deletingProduct}
          onOpenChange={(isOpen) => !isOpen && setDeletingProduct(null)}
        />
      )}
      
      {updatingStockProduct && (
        <UpdateStockDialog
          product={updatingStockProduct}
          onUpdateStock={handleUpdateStock}
          open={!!updatingStockProduct}
          onOpenChange={(isOpen) => !isOpen && setUpdatingStockProduct(null)}
          hasWriteAccess={hasWriteAccess}
        />
      )}

      {forecastingProduct && (
         <StockForecastingDialog
          product={forecastingProduct}
          open={!!forecastingProduct}
          onOpenChange={(isOpen) => !isOpen && setForecastingProduct(null)}
        />
      )}
    </div>
  );
}
