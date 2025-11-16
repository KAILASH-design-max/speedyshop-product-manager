
"use client";

import { AlertTriangle, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { useMemo } from "react";

interface LowStockAlertsProps {
  products: Product[];
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  const lowStockItems = useMemo(() => {
    return products.flatMap(p => 
      (p.variants || [])
        .filter(v => v.stock <= v.lowStockThreshold)
        .map(v => ({
          id: `${p.id}-${v.id}`,
          name: p.isVariable ? `${p.name} (${v.name})` : p.name,
          stock: v.stock,
        }))
    );
  }, [products]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Low Stock Alerts</CardTitle>
        </div>
        <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
      </CardHeader>
      <CardContent>
        {lowStockItems.length > 0 ? (
          <ScrollArea className="h-48">
            <ul className="space-y-3">
              {lowStockItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-destructive font-bold">{item.stock} left</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p>No low stock items. <br/> Everything is well-stocked!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
