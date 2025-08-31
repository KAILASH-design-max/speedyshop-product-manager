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
    const { imageUrls, ...rest } = values;

    // Convert empty strings for optional number fields to undefined
    const originalPrice = rest.originalPrice === '' ? undefined : Number(rest.originalPrice);
    const popularity = rest.popularity === '' ? undefined : Number(rest.popularity);

    const updatedProduct = {
      ...product,
      ...rest,
      images: imageUrls ? imageUrls.split('\n').filter(url => url.trim() !== '') : [],
      originalPrice,
      popularity,
      supplierId: rest.supplierId === 'none' ? undefined : rest.supplierId,
    };
    onUpdateProduct(updatedProduct);
  };

  const defaultValues = {
    ...product,
    imageUrls: product.images ? product.images.join('\n') : "",
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
