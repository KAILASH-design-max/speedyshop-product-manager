"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product, Supplier } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getAIProductDescription, getAIProductCategory, getAIProductName, getAIProductImage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { getSuppliers } from "@/lib/firestore";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
  lowStockThreshold: z.coerce.number().int().min(0, { message: "Threshold cannot be negative." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  originalPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  category: z.string().min(2, { message: "Category is required." }),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().optional(),
  origin: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  popularity: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  supplierId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => void;
  defaultValues?: Partial<ProductFormValues>;
  buttonText: string;
}

const productCategories = [
  "Daily Bread & Eggs",
  "Fruits & Vegetables",
  "Breakfast & Instant Food",
  "Cold Drinks & Juices",
  "Snacks & Munchies",
  "Bakery & Biscuits",
  "Tea, Coffee & Health Drink",
  "Atta, Rice & Dal",
  "Masala, Oil & More",
  "Sweet Tooth",
  "Sauces & Spreads",
  "Chicken, Meat & Fish",
  "Organic & Healthy Living",
  "Baby Care",
  "Pharma & Wellness",
  "Cleaning Essentials",
  "Home & Office",
  "Personal Care",
  "Pet Care",
  "Paan Corner",
  "SpeedyBistro",
];


export function ProductForm({ onSubmit, defaultValues, buttonText }: ProductFormProps) {
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const suppliersFromDb = await getSuppliers();
        setSuppliers(suppliersFromDb);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch suppliers.",
        });
      }
    }
    fetchSuppliers();
  }, [toast]);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      stock: defaultValues?.stock ?? 0,
      lowStockThreshold: defaultValues?.lowStockThreshold ?? 10,
      price: defaultValues?.price ?? 0,
      originalPrice: defaultValues?.originalPrice ?? '',
      category: defaultValues?.category ?? "",
      subcategory: defaultValues?.subcategory ?? "",
      description: defaultValues?.description ?? "",
      weight: defaultValues?.weight ?? "",
      origin: defaultValues?.origin ?? "",
      status: defaultValues?.status ?? "active",
      popularity: defaultValues?.popularity ?? '',
      supplierId: defaultValues?.supplierId ?? "",
    },
  });

  const imageUrl = form.watch("imageUrl");
  
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

  const handleGenerateName = async () => {
    const { category, description } = form.getValues();
    if (!category) {
      toast({
        variant: "destructive",
        title: "Missing Category",
        description: "Please enter a Category first to generate a name.",
      });
      return;
    }

    setIsGeneratingName(true);
    try {
      const result = await getAIProductName({ category, description });
      if (result.productName) {
        form.setValue("name", result.productName, { shouldValidate: true });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate a product name. Please try again.",
      });
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleGenerateImage = async () => {
    const { name, category } = form.getValues();
    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a Product Name and Category first to generate an image.",
      });
      return;
    }

    setIsGeneratingImage(true);
    form.setValue("imageUrl", ""); // Clear previous image
    try {
      const result = await getAIProductImage({ productName: name, category: category });
      if (result.imageUrl) {
        form.setValue("imageUrl", result.imageUrl, { shouldValidate: true });
      } else {
         throw new Error("Received an empty image URL.");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: "Could not generate an image. Please try again later.",
      });
    } finally {
      setIsGeneratingImage(false);
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
              <div className="flex items-center justify-between">
                <FormLabel>Product Name</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateName}
                  disabled={isGeneratingName}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingName ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <FormControl>
                <Input placeholder="e.g., Classic T-Shirt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Product Image URL</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingImage ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="w-full aspect-video relative bg-muted rounded-md flex items-center justify-center">
            {isGeneratingImage ? (
              <Skeleton className="h-full w-full" />
            ) : imageUrl ? (
              <Image src={imageUrl} alt="Generated product image" layout="fill" objectFit="contain" className="rounded-md" />
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center">
                <ImageIcon className="h-8 w-8 mb-2" />
                <p>Image will be generated here</p>
              </div>
            )}
        </div>
        
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

         <div className="grid grid-cols-2 gap-4">
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
             <FormField
              control={form.control}
              name="popularity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popularity (0-100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50" {...field} />
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
                  <SelectItem value="none">No Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
