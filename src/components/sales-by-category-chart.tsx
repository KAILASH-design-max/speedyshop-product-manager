"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import type { Order, Product } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Layers } from "lucide-react";

interface SalesByCategoryChartProps {
  orders: Order[];
  products: Product[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c", "#8dd1e1"];

export function SalesByCategoryChart({ orders, products }: SalesByCategoryChartProps) {
  const salesByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.category) {
          const category = product.category;
          const saleAmount = item.price * item.quantity;
          if (categoryMap[category]) {
            categoryMap[category] += saleAmount;
          } else {
            categoryMap[category] = saleAmount;
          }
        }
      });
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);
  
  const chartConfig = useMemo(() => {
    const config: any = {};
    salesByCategory.forEach((category, index) => {
        config[category.name] = {
            label: category.name,
            color: COLORS[index % COLORS.length]
        }
    });
    return config;
  }, [salesByCategory])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <CardTitle>Sales by Category</CardTitle>
        </div>
        <CardDescription>A breakdown of revenue from each product category.</CardDescription>
      </CardHeader>
      <CardContent>
        {salesByCategory.length > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px]">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie
                        data={salesByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                          return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                    >
                    {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                </PieChart>
            </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <Layers className="h-12 w-12 mb-2" />
            <p>No sales data available. <br/> Create an order to see category analytics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
