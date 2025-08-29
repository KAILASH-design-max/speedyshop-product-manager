"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getAIProductDescription, getAIProductCategory } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
  lowStockThreshold: z.coerce.number().int().min(0, { message: "Threshold cannot be negative." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().min(2, { message: "Category is required." }),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().optional(),
  origin: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => void;
  defaultValues?: Partial<Product>;
  buttonText: string;
}

export function ProductForm({ onSubmit, defaultValues, buttonText }: ProductFormProps) {
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      stock: defaultValues?.stock ?? 0,
      lowStockThreshold: defaultValues?.lowStockThreshold ?? 10,
      price: defaultValues?.price ?? 0,
      originalPrice: defaultValues?.originalPrice ?? undefined,
      category: defaultValues?.category ?? "",
      subcategory: defaultValues?.subcategory ?? "",
      description: defaultValues?.description ?? "",
      weight: defaultValues?.weight ?? "",
      origin: defaultValues?.origin ?? "",
      status: defaultValues?.status ?? "active",
    },
  });
  
  const handleGenerateDescription = async () => {
    const { name, category } = form.getValues();
    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a Product Name and Category first.",
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const result = await getAIProductDescription({
        productName: name,
        category: category,
      });
      form.setValue("description", result.description, { shouldValidate: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate a description. Please try again.",
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateCategory = async () => {
    const { name } = form.getValues();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Product Name",
        description: "Please enter a Product Name first to generate categories.",
      });
      return;
    }

    setIsGeneratingCategory(true);
    try {
      const result = await getAIProductCategory({ productName: name });
      if (result.category) {
        form.setValue("category", result.category, { shouldValidate: true });
      }
      if (result.subcategory) {
        form.setValue("subcategory", result.subcategory, { shouldValidate: true });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate categories. Please try again.",
      });
    } finally {
      setIsGeneratingCategory(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Classic T-Shirt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
            <FormLabel>Category & Subcategory</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateCategory}
              disabled={isGeneratingCategory}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingCategory ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="e.g., Fruits & Vegetables" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="e.g., Fresh Vegetables" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Price (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Local Farms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
         <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Description</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingDesc ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <FormControl>
                <Textarea placeholder="Enter product description or generate one with AI." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{buttonText}</Button>
      </form>
    </Form>
  );
}
