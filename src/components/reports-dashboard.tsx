"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart, DollarSign, Package, Users, ShoppingCart } from "lucide-react";
import { subDays, startOfDay } from "date-fns";

import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product, UserProfile } from "@/lib/types";
import { getOrders, getProducts, getAllUsers } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";

import { KpiCard } from "./kpi-card";
import { SalesOverTimeChart } from "./sales-over-time-chart";
import { TopProductsChart } from "./top-products-chart";
import { SalesByCategoryChart } from "./sales-by-category-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function ReportsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const [productsFromDb, ordersFromDb, usersFromDb] = await Promise.all([
          getProducts(),
          getOrders(),
          getAllUsers(),
        ]);
        setProducts(productsFromDb);
        setOrders(ordersFromDb);
        setUsers(usersFromDb);
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

  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = startOfDay(subDays(new Date(), days));
    return orders.filter(order => order.orderDate?.toDate() >= startDate);
  }, [orders, timeRange]);
  
  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0), [filteredOrders]);
  const totalSales = useMemo(() => filteredOrders.length, [filteredOrders]);
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart className="h-8 w-8" /> Business Intelligence</h1>
           <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <TabsList>
                    <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
                    <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
                    <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
                    <TabsTrigger value="all">All Time</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-8">
            <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} loading={loading} />
            <KpiCard title="Total Sales" value={totalSales.toString()} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} loading={loading} />
            <KpiCard title="Total Products" value={products.length.toString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} loading={loading} />
            <KpiCard title="Total Customers" value={users.length.toString()} icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={loading} />
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            {loading ? <Skeleton className="h-96" /> : <SalesOverTimeChart orders={filteredOrders} />}
            {loading ? <Skeleton className="h-96" /> : <TopProductsChart orders={filteredOrders} />}
        </div>
        <div className="mt-8">
            {loading ? <Skeleton className="h-96" /> : <SalesByCategoryChart orders={filteredOrders} products={products} />}
        </div>

      </main>
    </div>
  );
}
