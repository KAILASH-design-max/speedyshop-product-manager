"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "./product-form";
import type { Product } from "@/lib/types";

interface AddProductDialogProps {
  children: React.ReactNode;
  onAddProduct: (product: Omit<Product, "id" | "historicalData">) => void;
}

export function AddProductDialog({ children, onAddProduct }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: Omit<Product, "id" | "historicalData">) => {
    onAddProduct(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <ProductForm onSubmit={handleSubmit} buttonText="Add Product" />
      </DialogContent>
    </Dialog>
  );
}
