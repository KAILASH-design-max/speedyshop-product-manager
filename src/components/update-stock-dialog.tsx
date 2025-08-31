"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Barcode as BarcodeIcon } from "recharts";
import { useState } from "react";
import { useReactToPrint } from "react-to-print";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product } from "@/lib/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Card, CardContent } from "./ui/card";
import { BarcodeDialog } from "./barcode-dialog";

interface UpdateStockDialogProps {
  product: Product;
  onUpdateStock: (productId: string, newStock: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasWriteAccess: boolean;
}

const formSchema = z.object({
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
});

type UpdateStockFormValues = z.infer<typeof formSchema>;

export function UpdateStockDialog({ product, onUpdateStock, open, onOpenChange, hasWriteAccess }: UpdateStockDialogProps) {
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const form = useForm<UpdateStockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { stock: product.stock },
  });

  const handleSubmit = (values: UpdateStockFormValues) => {
    onUpdateStock(product.id, values.stock);
  };

  const chartData = JSON.parse(product.historicalData || "[]");

  const chartConfig = {
    stock: {
      label: "Stock",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle>Update Stock for {product.name}</DialogTitle>
                <DialogDescription>
                  Enter the new stock quantity. The current stock is {product.stock}.
                </DialogDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsBarcodeOpen(true)}>
                <BarcodeIcon className="h-4 w-4" />
                <span className="sr-only">View Barcode</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                   <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Stock Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} disabled={!hasWriteAccess} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={!hasWriteAccess}>Update Stock</Button>
                    </form>
                  </Form>
              </div>
              <div>
                  <h4 className="font-semibold mb-2 text-center text-sm">Stock History</h4>
                  <Card>
                      <CardContent className="pt-6">
                          <ChartContainer config={chartConfig} className="h-48 w-full">
                              <LineChart accessibilityLayer data={chartData} margin={{ left: -20, right: 20, top: 5, bottom: 5 }}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                  dataKey="date"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  />
                                   <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                  <Line dataKey="stock" type="monotone" stroke="var(--color-stock)" strokeWidth={2} dot={false} />
                              </LineChart>
                          </ChartContainer>
                      </CardContent>
                  </Card>
              </div>
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