
"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product } from "@/lib/types";
import { getOrders, getProducts } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const [productsFromDb, ordersFromDb] = await Promise.all([
          getProducts(),
          getOrders(),
        ]);
        setProducts(productsFromDb);
        setOrders(ordersFromDb);
        setInitialDataLoaded(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch initial data for reporting.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [toast]);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
        </div>
        
        <Alert className="text-center">
            <BrainCircuit className="h-4 w-4" />
            <AlertTitle>Reporting Dashboard</AlertTitle>
            <AlertDescription>
                This is where your business intelligence reports will be displayed.
            </AlertDescription>
        </Alert>

      </main>
    </div>
  );
}
