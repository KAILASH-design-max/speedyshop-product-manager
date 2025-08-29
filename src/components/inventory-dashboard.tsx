"use client";

import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";

import type { Product } from "@/lib/types";
import {
  addProduct,
  deleteProduct,
  getProducts,
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

export function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [forecastingProduct, setForecastingProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsFromDb = await getProducts();
        setProducts(productsFromDb);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleAddProduct = async (
    newProductData: Omit<Product, "id" | "historicalData">
  ) => {
    try {
      const newProduct = await addProduct(newProductData);
      setProducts((prev) => [...prev, newProduct]);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
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
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeletingProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
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
            <AddProductDialog onAddProduct={handleAddProduct}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </AddProductDialog>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => setDeletingProduct(product)}
                    onUpdateStock={() => setUpdatingStockProduct(product)}
                    onForecast={() => setForecastingProduct(product)}
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
