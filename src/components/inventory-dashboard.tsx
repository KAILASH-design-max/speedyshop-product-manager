"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import type { Product } from "@/lib/types";
import { initialProducts } from "@/lib/mock-data";
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [forecastingProduct, setForecastingProduct] = useState<Product | null>(null);

  const handleAddProduct = (newProduct: Omit<Product, "id" | "historicalData">) => {
    const productWithId: Product = {
      ...newProduct,
      id: `prod_${Date.now()}`,
      historicalData: JSON.stringify([{ date: new Date().toISOString().split('T')[0], stock: newProduct.stock }], null, 2),
    };
    setProducts((prev) => [...prev, productWithId]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeletingProduct(null);
  };
  
  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              historicalData: JSON.stringify(
                [...JSON.parse(p.historicalData), { date: new Date().toISOString().split('T')[0], stock: newStock }],
                null,
                2
              ),
            }
          : p
      )
    );
    setUpdatingStockProduct(null);
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
