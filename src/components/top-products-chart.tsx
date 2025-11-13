"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Award } from "lucide-react";

interface TopProductsChartProps {
  orders: Order[];
}

export function TopProductsChart({ orders }: TopProductsChartProps) {
  const topProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string, quantity: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
        } else {
          productSales[item.productId] = { name: item.name, quantity: item.quantity };
        }
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5 products
  }, [orders]);
  
  const chartConfig = {
    quantity: {
      label: "Quantity Sold",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle>Top Selling Products</CardTitle>
        </div>
        <CardDescription>Your best performing products by quantity sold.</CardDescription>
      </CardHeader>
      <CardContent>
        {topProducts.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart accessibilityLayer data={topProducts} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        width={100}
                        tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                    />
                    <XAxis dataKey="quantity" type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} layout="vertical">
                    </Bar>
                </BarChart>
            </ChartContainer>
        ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center text-muted-foreground">
                <Award className="h-12 w-12 mb-2" />
                <p>No sales data available. <br/> Top products will appear here once you have sales.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
