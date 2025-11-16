
"use client";

import { useMemo } from "react";
import { BarChart, Package } from "lucide-react";
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart } from "recharts";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface StockReportChartProps {
  products: Product[];
}

export function StockReportChart({ products }: StockReportChartProps) {
    const chartData = useMemo(() => {
        return products.flatMap(p => 
            (p.variants || []).map(v => ({
                name: p.isVariable ? `${p.name.slice(0,10)}... (${v.name})` : p.name,
                stock: v.stock
            }))
        ).slice(0, 20); // Show top 20 variants for clarity
    }, [products]);

    const chartConfig = {
        stock: {
            label: "Stock",
            color: "hsl(var(--primary))",
        },
    };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-primary" />
            <CardTitle>Stock Levels Overview</CardTitle>
        </div>
        <CardDescription>A visual summary of current stock quantities across products/variants.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-48 w-full">
                <RechartsBarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="stock" fill="var(--color-stock)" radius={4} />
                </RechartsBarChart>
            </ChartContainer>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                <Package className="h-12 w-12 mb-2" />
                <p>No products in inventory. <br/> Add a product to see the report.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
