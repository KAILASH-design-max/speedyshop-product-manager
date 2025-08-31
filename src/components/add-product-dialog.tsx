"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm, type ProductFormValues } from "./product-form";
import type { Product } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface AddProductDialogProps {
  children: React.ReactNode;
  onAddProduct: (product: Omit<Product, "id" | "historicalData">) => void;
}

export function AddProductDialog({ children, onAddProduct }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: ProductFormValues) => {
    const { imageUrl, ...rest } = values;
    
    // Convert empty strings for optional number fields to undefined
    const cost = rest.cost === '' ? undefined : Number(rest.cost);
    const originalPrice = rest.originalPrice === '' ? undefined : Number(rest.originalPrice);
    const popularity = rest.popularity === '' ? undefined : Number(rest.popularity);

    const productData = {
      ...rest,
      images: imageUrl ? [imageUrl] : [],
      cost,
      originalPrice,
      popularity,
      supplierId: rest.supplierId === 'none' ? undefined : rest.supplierId,
    };
    onAddProduct(productData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <ProductForm onSubmit={handleSubmit} buttonText="Add Product" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
