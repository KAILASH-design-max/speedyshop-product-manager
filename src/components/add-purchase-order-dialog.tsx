
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Search, Trash2, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

import type { Product, PurchaseOrder, PurchaseOrderItem, Supplier } from "@/lib/types";
import { getProducts, getSuppliers } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "./ui/badge";

const poItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  costPerItem: z.coerce.number().min(0, "Cost must be a positive number"),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "A supplier is required."),
  items: z.array(poItemSchema).min(1, "At least one item is required."),
});

type PurchaseOrderFormValues = z.infer<typeof formSchema>;

interface AddPurchaseOrderDialogProps {
  onAddPurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, "id">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPurchaseOrderDialog({ onAddPurchaseOrder, open, onOpenChange }: AddPurchaseOrderDialogProps) {
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsFromDb, suppliersFromDb] = await Promise.all([getProducts(), getSuppliers()]);
        setAllProducts(productsFromDb);
        setSuppliers(suppliersFromDb);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch products or suppliers." });
      }
    }
    fetchData();
  }, [toast]);
  
  const selectedProductIds = form.watch("items").map(item => item.productId);

  const handleAddProduct = (product: Product) => {
    if (selectedProductIds.includes(product.id)) {
      toast({ variant: "destructive", description: `${product.name} is already in the order.` });
      return;
    }
    append({ productId: product.id, name: product.name, quantity: 1, costPerItem: product.price || 0 });
  };
  
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

  const totalCost = form.watch("items").reduce((total, item) => total + (item.quantity * item.costPerItem), 0);

  const handleSubmit = (values: PurchaseOrderFormValues) => {
    const finalPO: Omit<PurchaseOrder, "id"> = {
        ...values,
        status: 'Pending',
        totalCost,
        createdAt: new Date(),
    };
    onAddPurchaseOrder(finalPO);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Select a supplier and add products to create a new PO.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Product Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Products</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-72 border rounded-md">
                    <div className="p-2 space-y-2">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <span className="text-sm font-medium">{product.name}</span>
                                <Button type="button" size="sm" variant="outline" onClick={() => handleAddProduct(product)} disabled={selectedProductIds.includes(product.id)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
              </div>

              {/* Right Column: Order Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Order Details</h3>
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ScrollArea className="h-72 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-[80px]">Qty</TableHead>
                                <TableHead className="w-[120px]">Cost/Item</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => <Input type="number" {...field} className="h-8" />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`items.${index}.costPerItem`}
                                            render={({ field }) => <Input type="number" step="0.01" {...field} className="h-8" />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {fields.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No products added yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
              </div>
            </div>
            
            <DialogFooter className="pt-6">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <span className="text-lg font-bold">Total Cost: </span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                    <Button type="submit">Create Purchase Order</Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

