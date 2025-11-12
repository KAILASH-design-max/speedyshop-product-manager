
"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Upload, Search, Printer, FileDown } from "lucide-react";
import Papa from "papaparse";

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
import { useAuth } from "@/hooks/use-auth";
import { BulkUploadDialog } from "./bulk-upload-dialog";
import { bulkAddProducts } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { PrintBarcodesDialog } from "./print-barcodes-dialog";


const productCategories = [
    "Dairy, Bread & Eggs",
    "Fruits & Vegetables",
    "Breakfast & Instant Food",
    "Cold Drinks & Juices",
    "Snacks & Munchies",
    "Bakery & Biscuits",
    "Tea, Coffee & Health Drink",
    "Atta, Rice & Dal",
    "Masala, Oil & More",
    "Sweet Tooth",
    "Sauces & Spreads",
    "Chicken, Meat & Fish",
    "Organic & Healthy Living",
    "Baby Care",
    "Pharma & Wellness",
    "Cleaning Essentials",
    "Home & Office",
    "Personal Care",
    "Pet Care",
    "Paan Corner",
    "Speedy Bistro",
];

export function InventoryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);


  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsFromDb = await getProducts();
      setProducts(productsFromDb);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch product data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchInitialData() {
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
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch initial data.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [user, toast]);

  const handleAddProduct = async (
    newProductData: Omit<Product, "id" | "historicalData">
  ) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to add products." });
       return;
    }
    try {
      const newProduct = await addProduct(newProductData);
      setProducts((prev) => [...prev, newProduct]);
      toast({ title: "Success", description: "Product added successfully." });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add the product." });
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to update products." });
       return;
    }
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      setEditingProduct(null);
      toast({ title: "Success", description: "Product updated successfully." });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update the product." });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete products." });
       return;
    }
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeletingProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the product." });
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to update stock." });
       return;
    }
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
      toast({ title: "Success", description: "Stock updated successfully." });
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update stock." });
    }
  };
  
  const handleBulkUpload = async (uploadedProducts: Omit<Product, "id" | "historicalData">[]) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to perform this action." });
       return;
    }
    try {
      const result = await bulkAddProducts(uploadedProducts);
      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `${result.count} products have been added to the inventory.`,
        });
        await fetchProducts(); // Refetch products to show the newly added ones
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Bulk upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not add products. Please check the file and try again.",
      });
    }
  };

  const handleProductSelection = (productId: string) => {
    const newSelectedIds = new Set(selectedProductIds);
    if (newSelectedIds.has(productId)) {
      newSelectedIds.delete(productId);
    } else {
      newSelectedIds.add(productId);
    }
    setSelectedProductIds(newSelectedIds);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        category: p.category,
        subcategory: p.subcategory,
        status: p.status,
        lowStockThreshold: p.lowStockThreshold,
        supplierId: p.supplierId,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'products.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedProducts = products.filter(p => selectedProductIds.has(p.id));


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Inventory</h1>
            {hasWriteAccess && (
               <div className="flex gap-2">
                <BulkUploadDialog onUpload={handleBulkUpload}>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                  </Button>
                </BulkUploadDialog>
                <AddProductDialog onAddProduct={handleAddProduct}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </AddProductDialog>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <LowStockAlerts products={products} />
            <StockReportChart products={products} />
          </div>

          <div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold">All Products ({filteredProducts.length})</h2>
                 {selectedProductIds.size > 0 && (
                  <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print ({selectedProductIds.size})
                  </Button>
                )}
                 {filteredProducts.length > 0 && (
                    <Button variant="outline" onClick={handleExportCSV}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export ({filteredProducts.length})
                    </Button>
                 )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-8 sm:w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {productCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>

            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => {
                        setSelectedProductIds(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(product.id);
                            return newSet;
                        });
                        setDeletingProduct(product);
                    }}
                    onUpdateStock={() => setUpdatingStockProduct(product)}
                    hasWriteAccess={hasWriteAccess}
                    isSelected={selectedProductIds.has(product.id)}
                    onSelectToggle={() => handleProductSelection(product.id)}
                  />
                ))}
              </div>
            )}
            {!loading && filteredProducts.length === 0 && (
                <div className="text-center col-span-full py-12 text-muted-foreground">
                    <p>No products found.</p>
                    {debouncedSearchTerm && <p>Try adjusting your search or filters.</p>}
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
      
      {isPrintDialogOpen && (
        <PrintBarcodesDialog
          products={selectedProducts}
          open={isPrintDialogOpen}
          onOpenChange={setIsPrintDialogOpen}
        />
      )}

    </div>
  );
}

    