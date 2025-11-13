
"use client";

import { useEffect, useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Order, UserProfile } from "@/lib/types";
import { getOrders, getUserProfile, getAllUsers } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ViewOrderDialog } from "./view-order-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [ordersFromDb, profile, usersFromDb] = await Promise.all([
        getOrders(),
        getUserProfile(user.uid),
        getAllUsers() // Assuming this is restricted by server-side logic/rules
      ]);
      setOrders(ordersFromDb);
      setUserProfile(profile);
      setAllUsers(usersFromDb);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch order data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getUserName = (userId: string) => {
    return allUsers.find(u => u.uid === userId)?.name || "Unknown User";
  };
  
  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'default';
        case 'Shipped': return 'secondary';
        case 'Processing': return 'secondary';
        case 'Pending': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'secondary';
    }
  }

  const filteredOrders = orders.filter(order => statusFilter === 'all' || order.status === statusFilter);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2"><ShoppingBag className="h-8 w-8" /> Sales Orders</h1>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {loading ? (
          <div className="border rounded-lg p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id.substring(0, 6)}...</TableCell>
                      <TableCell>{getUserName(order.userId)}</TableCell>
                      <TableCell>
                        {order.orderDate?.toDate ? format(order.orderDate.toDate(), "MMM d, yyyy") : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setViewingOrder(order)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No sales orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      
      {viewingOrder && (
          <ViewOrderDialog
            order={viewingOrder}
            customerName={getUserName(viewingOrder.userId)}
            open={!!viewingOrder}
            onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}
            hasWriteAccess={hasWriteAccess}
            onSuccess={fetchData}
          />
      )}
    </div>
  );
}
