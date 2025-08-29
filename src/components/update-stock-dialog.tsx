"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product } from "@/lib/types";

interface UpdateStockDialogProps {
  product: Product;
  onUpdateStock: (productId: string, newStock: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
});

type UpdateStockFormValues = z.infer<typeof formSchema>;

export function UpdateStockDialog({ product, onUpdateStock, open, onOpenChange }: UpdateStockDialogProps) {
  const form = useForm<UpdateStockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { stock: product.stock },
  });

  const handleSubmit = (values: UpdateStockFormValues) => {
    onUpdateStock(product.id, values.stock);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock for {product.name}</DialogTitle>
          <DialogDescription>
            Enter the new stock quantity. The current stock is {product.stock}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Update Stock</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
