"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "./product-form";
import type { Product } from "@/lib/types";

interface EditProductDialogProps {
  product: Product;
  onUpdateProduct: (product: Product) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ product, onUpdateProduct, open, onOpenChange }: EditProductDialogProps) {
  const handleSubmit = (values: {name: string, stock: number, lowStockThreshold: number}) => {
    onUpdateProduct({ ...values, id: product.id, historicalData: product.historicalData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {product.name}</DialogTitle>
        </DialogHeader>
        <ProductForm onSubmit={handleSubmit} defaultValues={product} buttonText="Save Changes" />
      </DialogContent>
    </Dialog>
  );
}
