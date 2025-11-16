
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product, Supplier, ProductVariant } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSuppliers } from "@/lib/firestore";
import { Switch } from "./ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const variantSchema = z.object({
  id: z.string(),
  name: z.string(),
  stock: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  sku: z.string().optional(),
  originalPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  weight: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  imageUrls: z.string().optional(),
  category: z.string().min(2, { message: "Category is required." }),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  origin: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  popularity: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  supplierId: z.string().optional(),
  isVariable: z.boolean(),
  variants: z.array(variantSchema).min(1, "Product must have at least one variant."),
});

export type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => void;
  defaultValues?: Partial<Product>;
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
    "Atta, Rice & Dal": ["Wheat Flour / Atta","Rice","Pulses / Dal","Specialty Flours","Organic Grains & Pulses","Rice Mixes & Ready-to-Cook","Lentil & Bean Mixes","Gluten-Free Flours","Sooji / Semolina / Rava","Flour & Rice Combos","Packaged Dal & Lentils","Flour & Rice Accessories",],
    "Masala, Oil & More": ["Cooking Oils","Whole Spices","Powdered Spices / Masala","Herbs & Seasonings","Ready-to-Use Masala Mixes","Salt & Sugar","Vinegar & Sauces","Pickles & Chutneys","Condiments & Dressings","Cooking Pastes & Marinades","Specialty Oils & Exotic Spices",],
    "Sweet Tooth": ["Chocolates & Bars","Candies & Toffees","Gummies & Jellies","Bakery Sweets","Sugar-Free Sweets","Dry Fruit Sweets","Instant Dessert Mixes","Chocolate & Nut Spreads","Frozen Desserts & Ice Creams","Sweet Snacks",],
    "Sauces & Spreads": ["Ketchup & Tomato Sauces","Mayonnaise & Dressings","Mustard & Condiments","Chutneys & Dips","Pasta & Pizza Sauces","Hot & Spicy Sauces","Peanut Butter & Nut Butters","Jam, Jelly & Fruit Spreads","Honey & Maple Syrup","Chocolate & Caramel Spreads","Marinades & Cooking Pastes","Health & Low-Sugar Spreads",],
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

// Helper to create all combinations of options
function getCombinations(options: string[][]): string[][] {
  if (options.length === 0) {
    return [[]];
  }
  const first = options[0];
  const rest = getCombinations(options.slice(1));
  const combinations: string[][] = [];
  first.forEach(option => {
    rest.forEach(combination => {
      combinations.push([option, ...combination]);
    });
  });
  return combinations;
}

export function ProductForm({ onSubmit, defaultValues, buttonText }: ProductFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();
  
  const [variantOptions, setVariantOptions] = useState<{name: string; values: string[]}[]>([
      { name: "Size", values: ["Small", "Medium", "Large"] },
  ]);
  
  const defaultIsVariable = defaultValues?.isVariable ?? false;
  const defaultVariants = defaultValues?.variants ?? [{
      id: "default-variant",
      name: "Default",
      stock: defaultValues?.stock ?? 0,
      price: defaultValues?.price ?? 0,
      lowStockThreshold: defaultValues?.lowStockThreshold ?? 10,
  }];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      imageUrls: defaultValues?.images?.join('\n') ?? "",
      category: defaultValues?.category ?? "",
      subcategory: defaultValues?.subcategory ?? "",
      description: defaultValues?.description ?? "",
      origin: defaultValues?.origin ?? "",
      status: defaultValues?.status ?? "active",
      popularity: defaultValues?.popularity ?? '',
      supplierId: defaultValues?.supplierId ?? "",
      isVariable: defaultIsVariable,
      variants: defaultVariants,
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  const isVariable = form.watch("isVariable");

  // This effect generates the variant combinations whenever the options change
  useEffect(() => {
    if (!isVariable) {
        // If not variable, ensure there's only one 'default' variant
        const currentVariants = form.getValues('variants');
        if (currentVariants.length !== 1 || currentVariants[0].id !== 'default-variant') {
            const defaultVariant = {
              id: "default-variant",
              name: "Default",
              price: currentVariants[0]?.price ?? 0,
              stock: currentVariants[0]?.stock ?? 0,
              lowStockThreshold: currentVariants[0]?.lowStockThreshold ?? 10,
            };
            replace([defaultVariant]);
        }
        return;
    };
    
    const optionValues = variantOptions.map(opt => opt.values).filter(v => v.length > 0);
    if(optionValues.length === 0) {
        replace([]);
        return;
    }

    const combinations = getCombinations(optionValues);
    const newVariants = combinations.map(combo => {
        const name = combo.join(', ');
        const id = combo.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, '')).join('-');
        const existingVariant = form.getValues('variants').find(v => v.name === name);
        return existingVariant || { id, name, price: 0, stock: 0, lowStockThreshold: 10, sku: '' };
    });

    replace(newVariants);
  }, [isVariable, variantOptions, replace, form]);

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

  const imageUrls = form.watch("imageUrls");
  const selectedCategory = form.watch("category") as keyof typeof categoryData;
  const firstImageUrl = imageUrls?.split('\n')[0].trim() || "";
  const isValidUrl = firstImageUrl && (firstImageUrl.startsWith('http://') || firstImageUrl.startsWith('https://') || firstImageUrl.startsWith('data:image'));

  useEffect(() => {
    if (defaultValues?.category !== selectedCategory) {
      form.setValue("subcategory", "");
    }
  }, [selectedCategory, form, defaultValues?.category]);
  
  const handleAddOption = () => {
    setVariantOptions([...variantOptions, { name: `Option ${variantOptions.length + 1}`, values: [] }]);
  };

  const handleRemoveOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const handleOptionNameChange = (index: number, newName: string) => {
    const newOptions = [...variantOptions];
    newOptions[index].name = newName;
    setVariantOptions(newOptions);
  };
  
  const handleOptionValuesChange = (index: number, newValues: string) => {
    const newOptions = [...variantOptions];
    newOptions[index].values = newValues.split(',').map(v => v.trim()).filter(Boolean);
    setVariantOptions(newOptions);
  };
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Product Info */}
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
               <FormLabel>Product Image URLs</FormLabel>
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
                <p>Primary image will appear here</p>
              </div>
            )}
        </div>

        {/* Categories, Supplier, etc */}
         <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
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
                <FormLabel>Subcategory</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
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
        
        {/* Variants Section */}
        <FormField
          control={form.control}
          name="isVariable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Product has multiple variants</FormLabel>
                <FormDescription>
                  Enable this if the product comes in different options, like size or color.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        {isVariable && (
          <div className="space-y-4 p-4 border rounded-lg">
            <FormLabel>Variant Options</FormLabel>
            {variantOptions.map((option, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="grid gap-1.5 flex-grow">
                   <FormLabel htmlFor={`option-name-${index}`} className="text-xs">Option Name</FormLabel>
                  <Input
                    id={`option-name-${index}`}
                    value={option.name}
                    onChange={(e) => handleOptionNameChange(index, e.target.value)}
                    placeholder="e.g., Size"
                  />
                </div>
                 <div className="grid gap-1.5 flex-grow">
                   <FormLabel htmlFor={`option-values-${index}`} className="text-xs">Option Values</FormLabel>
                    <Input
                      id={`option-values-${index}`}
                      value={option.values.join(', ')}
                      onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                      placeholder="e.g., Small, Medium, Large"
                    />
                 </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveOption(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}><Plus className="mr-2 h-4 w-4" /> Add another option</Button>
          </div>
        )}
        
        <div className="space-y-2">
            <FormLabel>Pricing &amp; Stock</FormLabel>
            <FormDescription>
                {isVariable ? "Define the price and stock for each generated variant." : "Define the price and stock for this product."}
            </FormDescription>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{isVariable ? 'Variant' : 'Product'}</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Low Stock Threshold</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="font-medium">{field.name}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.price`}
                                        render={({ field }) => <Input type="number" className="h-8" {...field} />}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.stock`}
                                        render={({ field }) => <Input type="number" className="h-8" {...field} />}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.lowStockThreshold`}
                                        render={({ field }) => <Input type="number" className="h-8" {...field} />}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <FormMessage>{form.formState.errors.variants?.root?.message}</FormMessage>
            </div>
        </div>

        {/* Other Fields */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description." {...field} />
              </FormControl>
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
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
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

        <Button type="submit" className="w-full">{buttonText}</Button>
      </form>
    </Form>
  );
}
