"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

interface SalesOverTimeChartProps {
  orders: Order[];
}

export function SalesOverTimeChart({ orders }: SalesOverTimeChartProps) {
  const chartData = useMemo(() => {
    const dailySales: { [key: string]: number } = {};
    orders.forEach(order => {
      const orderDate = order.orderDate?.toDate();
      if (orderDate) {
        const dateStr = format(orderDate, "yyyy-MM-dd");
        if (dailySales[dateStr]) {
          dailySales[dateStr] += order.totalAmount;
        } else {
          dailySales[dateStr] = order.totalAmount;
        }
      }
    });
    return Object.entries(dailySales)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [orders]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle>Sales Over Time</CardTitle>
        </div>
        <CardDescription>A summary of your revenue over the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value as number, 'INR').replace('₹', '')} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
            </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-2" />
            <p>No sales data in this period. <br/> Create an order to see your sales performance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
