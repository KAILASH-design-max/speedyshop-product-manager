
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm, type ProductFormValues } from "./product-form";
import type { Product, ProductVariant } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface AddProductDialogProps {
  children: React.ReactNode;
  onAddProduct: (product: Omit<Product, "id" | "historicalData">) => void;
}

export function AddProductDialog({ children, onAddProduct }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: ProductFormValues) => {
    const { imageUrls, ...rest } = values;

    const formattedVariants = rest.variants.map(v => ({
      ...v,
      originalPrice: v.originalPrice === '' ? undefined : Number(v.originalPrice),
    }));

    const productData = {
      ...rest,
      variants: formattedVariants,
      images: imageUrls ? imageUrls.split('\n').filter(url => url.trim() !== '') : [],
      popularity: rest.popularity === '' ? undefined : Number(rest.popularity),
      supplierId: rest.supplierId === 'none' ? undefined : rest.supplierId,
    };
    onAddProduct(productData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] pr-6">
          <ProductForm onSubmit={handleSubmit} buttonText="Add Product" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
