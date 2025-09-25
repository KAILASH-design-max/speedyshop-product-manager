
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product, Supplier } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSuppliers } from "@/lib/firestore";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  imageUrls: z.string().optional(),
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

const categoryData = {
    "Dairy, Bread & Eggs": ["Milk & Toned Milk","Curd & Yogurt","Paneer & Tofu","Cheese & Butter","Bread & Buns","Cakes & Bakery Snacks","Eggs & Egg Products","Ghee & Cream","Milkshakes & Flavored Milk","Lassi & Buttermilk","Frozen Desserts & Ice Creams","Dairy Beverages",],
    "Fruits & Vegetables": ["Fresh Fruits","Fresh Vegetables","Freshly Cut & Sprouts","Leafies & Herbs","Frozen Veg","Mangoes & Melons","Seasonal","Exotics",],
    "Breakfast & Instant Food": ["Instant Noodles & Pasta","Ready-to-Eat Meals","Breakfast Cereals & Oats","Poha, Upma & Vermicelli","Bread Spreads & Jams","Peanut Butter & Nut Spreads","Soup Mixes & Instant Soups","Energy & Protein Bars","Instant Mixes","Granola & Muesli","Tea, Coffee & Beverages","Health Drinks & Mixes",],
    "Cold Drinks & Juices": ["Soft Drinks","Packaged Drinking Water","Flavored Water & Soda","Fruit Juices","Energy Drinks","Sports & Electrolyte Drinks","Iced Tea & Cold Coffee","Mocktails & Mixers","Concentrates & Syrups","Health & Wellness Drinks","Kids’ Drinks",],
    "Snacks & Munchies": ["Chips & Crisps","Namkeen & Mixtures","Popcorn","Roasted Snacks","Dry Fruits & Nuts","Healthy Snacks & Energy Bars",],
    "Bakery & Biscuits": ["Bread & Buns", "Cookies & Biscuits", "Cakes & Pastries", "Rusk & Toasts", "Savory Bakery Snacks", "Muffins & Cupcakes", "Premium & Designer Cakes", "Gluten-Free Bakery", "Breakfast Bakery Items", "Frozen Bakery Products", "Specialty Flavored Biscuits"],
    "Tea, Coffee & Health Drink": ["Black Tea & Green Tea","Herbal & Flavored Tea","Instant Tea & Tea Bags","Coffee Powder & Beans","Instant Coffee & Coffee Mixes","Decaffeinated Coffee","Energy & Health Drinks","Protein & Nutritional Drinks","Milk-Based Beverages","Ready-to-Drink Tea & Coffee","Tea & Coffee Accessories","Herbal & Wellness Tonics"],
    "Atta, Rice & Dal": ["Wheat Flour & Atta","Basmati Rice","Non-Basmati Rice","Pulses & Lentils","Sooji & Besan","Poha & Flattened Rice",],
    "Masala, Oil & More": ["Spices & Masalas","Edible Oils & Ghee","Salt & Sugar","Hing & Asafoetida","Pickles & Papad","Baking Essentials",],
    "Sweet Tooth": ["Chocolates","Indian Sweets (Mithai)","Candy & Lollipops","Toffees","Dessert Mixes","Ice Creams & Frozen Desserts",],
    "Sauces & Spreads": ["Tomato Ketchup","Mayonnaise","Peanut Butter","Jam & Honey","Chutneys & Dips","Cooking Sauces (Soy, Chili, Pasta Sauce)",],
    "Chicken, Meat & Fish": ["Fresh Chicken","Fresh Mutton","Fish & Seafood","Frozen Meat","Processed Meat (Sausages, Salami)","Eggs",],
    "Organic & Healthy Living": ["Organic Atta, Rice & Dal","Organic Fruits & Vegetables","Organic Snacks","Organic Oils & Spices","Superfoods (Seeds, Quinoa, Chia)",],
    "Baby Care": ["Baby Food & Formula","Diapers & Wipes","Baby Skincare & Bath","Baby Health & Wellness","Feeding Bottles & Accessories","Baby Clothing & Essentials","Baby Bedding & Travel","Baby Toys & Learning"],
    "Pharma & Wellness": ["Over-the-Counter Medicines","Prescription Medicines","Ayurveda & Herbal Care","Vitamins & Supplements","Personal Wellness","Health Devices","First Aid & Essentials","Women’s Health","Men’s Health","Senior Citizen Care","Baby & Kids Health","Immunity & Preventive Care"],
    "Cleaning Essentials": ["Surface Cleaners","Toilet & Bathroom Cleaners","Dishwashing Essentials","Laundry Care","Air Fresheners & Deodorizers","Disinfectants & Sanitizers","Cleaning Tools & Accessories","Glass & Multi-purpose Cleaners","Kitchen Cleaning Essentials","Waste Disposal"],
    "Home & Office": ["Stationery & Office Supplies","Cleaning & Organizing","Home Utility","Kitchen & Dining Essentials","Furniture & Furnishings","Decor & Lighting","Appliances & Electronics","Home Safety & Tools","Paper Products","Packaging & Storage"],
    "Personal Care": ["Skin Care","Hair Care","Oral Care","Bath & Body","Men’s Grooming","Women’s Hygiene","Deodorants & Perfumes","Hand Wash & Sanitizers","Wellness & Grooming Tools"],
    "Pet Care": ["Pet Food","Pet Grooming","Pet Health & Wellness","Pet Accessories","Pet Hygiene","Pet Training Essentials","Aquatic & Small Pets"],
    "Paan Corner": ["Paan Varieties","Mouth Fresheners","Supari & Areca Nut","Tobacco-Free Products","Sweeteners & Add-ons","Betel Leaves","Flavored Candies & Digestives"],
    "Speedy Bistro": ["Burgers & Sandwiches","Pizzas","Rolls & Wraps","Momos & Dumplings","Pasta","Desserts & Beverages",],
};


const productCategories = Object.keys(categoryData);


export function ProductForm({ onSubmit, defaultValues, buttonText }: ProductFormProps) {
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
      imageUrls: defaultValues?.imageUrls ?? "",
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

  const imageUrls = form.watch("imageUrls");
  const selectedCategory = form.watch("category") as keyof typeof categoryData;
  const firstImageUrl = imageUrls?.split('\n')[0].trim() || "";
  const isValidUrl = firstImageUrl && (firstImageUrl.startsWith('http://') || firstImageUrl.startsWith('https://') || firstImageUrl.startsWith('data:image'));

  useEffect(() => {
    // Reset subcategory when category changes
    if (defaultValues?.category !== selectedCategory) {
      form.setValue("subcategory", "");
    }
  }, [selectedCategory, form, defaultValues?.category]);

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
        
        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
               <div className="flex items-center justify-between">
                  <FormLabel>Product Image URLs</FormLabel>
               </div>
              <FormControl>
                <Textarea placeholder="https://example.com/image1.png&#x0a;https://example.com/image2.png" {...field} />
              </FormControl>
              <FormDescription>
                Enter one URL per line. The first URL will be the primary image.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="w-full aspect-video relative bg-muted rounded-md flex items-center justify-center overflow-hidden">
            {isValidUrl ? (
              <Image src={firstImageUrl} alt="Product image" width={400} height={400} className="w-full h-full object-contain" />
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center">
                <ImageIcon className="h-8 w-8 mb-2" />
                <p>Primary image will be shown here</p>
              </div>
            )}
        </div>
        
        <div className="flex items-center justify-between">
            <FormLabel>Category &amp; Subcategory</FormLabel>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryData[selectedCategory]?.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
              <FormControl>
                <Textarea placeholder="Enter product description." {...field} />
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

    

    






    


    

    
    