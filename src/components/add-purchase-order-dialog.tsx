
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Search, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

import type { Product, PurchaseOrder, Supplier, ProductVariant } from "@/lib/types";
import { getProducts, getSuppliers } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";

const poItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
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
  
  const selectedVariantIds = form.watch("items").map(item => item.variantId);

  const handleAddProductVariant = (product: Product, variant: ProductVariant) => {
    if (selectedVariantIds.includes(variant.id)) {
      toast({ variant: "destructive", description: `${product.name} (${variant.name}) is already in the order.` });
      return;
    }
    append({ 
        productId: product.id, 
        variantId: variant.id, 
        name: `${product.name} (${variant.name})`, 
        quantity: 1, 
        costPerItem: variant.price || 0 
    });
  };
  
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
          <DialogDescription>Select a supplier and add product variants to create a new PO.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Product Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Products</h3>
                <ProductVariantSelector products={allProducts} onSelect={handleAddProductVariant} selectedVariantIds={selectedVariantIds} />
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

function ProductVariantSelector({ products, onSelect, selectedVariantIds }: { products: Product[], onSelect: (product: Product, variant: ProductVariant) => void, selectedVariantIds: string[] }) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    Search product or variant...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." onValueChange={setSearchTerm} />
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandList>
                        <ScrollArea className="h-72">
                            {filteredProducts.map((product) => (
                                <CommandGroup key={product.id} heading={product.name}>
                                    {product.variants.map((variant) => (
                                        <CommandItem
                                            key={variant.id}
                                            value={`${product.name} ${variant.name}`}
                                            onSelect={() => {
                                                onSelect(product, variant)
                                                setOpen(false)
                                            }}
                                            disabled={selectedVariantIds.includes(variant.id)}
                                        >
                                            {variant.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
