"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product, Festival } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getProducts } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  title: z.string().min(2, { message: "Festival title must be at least 2 characters." }),
  dateRange: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  productIds: z.array(z.string()).optional(),
  urlSlug: z.string().min(2, { message: "URL slug must be at least 2 characters." }).regex(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens." }),
  isActive: z.boolean(),
});

export type FestivalFormValues = z.infer<typeof formSchema>;

interface FestivalFormProps {
  onSubmit: (values: FestivalFormValues) => void;
  defaultValues?: Partial<FestivalFormValues & Festival>;
  buttonText: string;
}

export function FestivalForm({ onSubmit, defaultValues, buttonText }: FestivalFormProps) {
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<FestivalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      dateRange: { from: defaultValues?.dateRange?.from, to: defaultValues?.dateRange?.to },
      productIds: defaultValues?.productIds ?? [],
      urlSlug: defaultValues?.urlSlug ?? "",
      isActive: defaultValues?.isActive ?? false,
    },
  });

  const selectedProductIds = form.watch("productIds") || [];
  const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsFromDb = await getProducts();
        setAllProducts(productsFromDb);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch products.",
        });
      }
    }
    fetchProducts();
  }, [toast]);
  
  useEffect(() => {
    if (!defaultValues?.urlSlug) {
      const slug = form.getValues('title').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      form.setValue('urlSlug', slug, { shouldValidate: true });
    }
  }, [form.watch('title'), form, defaultValues?.urlSlug]);

  const handleProductToggle = (productId: string) => {
    const currentIds = form.getValues('productIds') || [];
    const newIds = currentIds.includes(productId)
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId];
    form.setValue('productIds', newIds, { shouldDirty: true });
  };
  
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Festival Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Diwali Dhamaka!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Festival Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, y")} -{" "}
                                {format(field.value.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={{from: field.value?.from, to: field.value?.to}}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="urlSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., diwali-2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div>
          <FormLabel>Link Products</FormLabel>
          <FormDescription className="mb-2">Search and select products to include in this festival campaign.</FormDescription>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-60">
                    <div className="space-y-2">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <span className="text-sm">{product.name}</span>
                                <Button type="button" size="sm" variant={selectedProductIds.includes(product.id) ? "secondary" : "outline"} onClick={() => handleProductToggle(product.id)}>
                                    {selectedProductIds.includes(product.id) ? "Remove" : "Add"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Selected Products ({selectedProducts.length})</h4>
                 <ScrollArea className="h-60">
                    <div className="space-y-1">
                        {selectedProducts.length > 0 ? selectedProducts.map(product => (
                             <Badge key={product.id} variant="secondary" className="mr-1 mb-1">
                                {product.name}
                                <button type="button" onClick={() => handleProductToggle(product.id)} className="ml-1.5 p-0.5 rounded-full hover:bg-muted-foreground/20">
                                    <X className="h-3 w-3" />
                                </button>
                             </Badge>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center pt-10">No products selected.</p>
                        )}
                    </div>
                 </ScrollArea>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Activate Festival</FormLabel>
                <FormDescription>
                  Make this festival campaign visible on the live app.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{buttonText}</Button>
      </form>
    </Form>
  );
}
