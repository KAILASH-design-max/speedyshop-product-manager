"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product } from "@/lib/types";
import { getOrders, getProducts } from "@/lib/firestore";
import { getBusinessInsights } from "@/app/actions";
import type { GenerateBusinessInsightsOutput } from "@/ai/flows/generate-business-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [insights, setInsights] = useState<GenerateBusinessInsightsOutput | null>(null);

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

  const handleGenerateInsights = async () => {
    setLoading(true);
    setInsights(null);
    try {
        const productDataString = JSON.stringify(products.map(({ id, name, category, price, cost, stock }) => ({ id, name, category, price, cost, stock })), null, 2);
        const orderDataString = JSON.stringify(orders.map(({ id, items, totalAmount, orderDate }) => ({ id, items, totalAmount, orderDate: orderDate?.toDate ? orderDate.toDate().toISOString() : orderDate })), null, 2);

        const result = await getBusinessInsights({ productData: productDataString, orderData: orderDataString });
        setInsights(result);
    } catch (error) {
        console.error("Error generating insights:", error);
        toast({
            variant: "destructive",
            title: "Insight Generation Failed",
            description: "The AI failed to generate business insights. Please try again later.",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <Button onClick={handleGenerateInsights} disabled={loading || !initialDataLoaded}>
            {loading && !insights ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            {loading ? "Generating..." : "Generate Insights"}
          </Button>
        </div>

        {insights ? (
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Summary</CardTitle>
                        <CardDescription>An AI-generated overview of your business performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <p>{insights.businessSummary}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Products</CardTitle>
                        <CardDescription>Your best-selling items based on recent sales data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {insights.topPerformingProducts.map((product, index) => (
                                <li key={index} className="text-sm"><strong>{product.productName}:</strong> {product.reason}</li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Strategic Recommendations</CardTitle>
                        <CardDescription>AI-powered suggestions to improve your business.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            {insights.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm">{rec}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <Alert className="text-center">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>Welcome to your AI-Powered Reports Dashboard!</AlertTitle>
                <AlertDescription>
                   Click the "Generate Insights" button to analyze your latest sales and inventory data.
                </AlertDescription>
            </Alert>
        )}

      </main>
    </div>
  );
}
