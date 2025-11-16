
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Barcode as BarcodeIcon } from "lucide-react";
import { useState, useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product, ProductVariant } from "@/lib/types";
import { BarcodeDialog } from "./barcode-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface UpdateStockDialogProps {
  product: Product;
  onUpdateStock: (productId: string, variants: ProductVariant[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasWriteAccess: boolean;
}

const formSchema = z.object({
  variants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  }))
});

type UpdateStockFormValues = z.infer<typeof formSchema>;

export function UpdateStockDialog({ product, onUpdateStock, open, onOpenChange, hasWriteAccess }: UpdateStockDialogProps) {
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  
  const defaultVariants = useMemo(() => {
    return product.variants?.map(v => ({ id: v.id, name: v.name, stock: v.stock })) || []
  }, [product]);

  const form = useForm<UpdateStockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variants: defaultVariants
    },
    // Rerender when defaultValues change
    values: { variants: defaultVariants }
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  const handleSubmit = (values: UpdateStockFormValues) => {
    const updatedVariants = product.variants.map(originalVariant => {
        const formVariant = values.variants.find(v => v.id === originalVariant.id);
        return formVariant ? { ...originalVariant, stock: formVariant.stock } : originalVariant;
    });
    onUpdateStock(product.id, updatedVariants);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle>Update Stock for {product.name}</DialogTitle>
                <DialogDescription>
                  Enter the new stock quantity for each variant.
                </DialogDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsBarcodeOpen(true)}>
                <BarcodeIcon className="h-4 w-4" />
                <span className="sr-only">View Barcode</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="max-h-80 overflow-y-auto border rounded-md">
                   <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead className="w-32">New Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.name}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`variants.${index}.stock`}
                              render={({ field }) => (
                                <Input type="number" {...field} disabled={!hasWriteAccess} />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button type="submit" className="w-full" disabled={!hasWriteAccess}>Update All Stock</Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
      <BarcodeDialog 
        product={product} 
        open={isBarcodeOpen} 
        onOpenChange={setIsBarcodeOpen} 
      />
    </>
  );
}
