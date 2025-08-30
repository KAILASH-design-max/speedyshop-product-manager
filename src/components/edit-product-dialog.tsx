"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm, type ProductFormValues } from "./product-form";
import type { Product } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface EditProductDialogProps {
  product: Product;
  onUpdateProduct: (product: Product) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ product, onUpdateProduct, open, onOpenChange }: EditProductDialogProps) {
  const handleSubmit = (values: ProductFormValues) => {
    const { imageUrl, ...rest } = values;
    const updatedProduct = {
      ...product,
      ...rest,
      images: imageUrl ? [imageUrl] : product.images || [],
    };
    onUpdateProduct(updatedProduct);
  };

  const defaultValues = {
    ...product,
    imageUrl: product.images && product.images.length > 0 ? product.images[0] : "",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {product.name}</DialogTitle>
           <DialogDescription>
            Update the product details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <ProductForm onSubmit={handleSubmit} defaultValues={defaultValues} buttonText="Save Changes" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
