
"use client";

import { useEffect, useState } from "react";
import { PlusCircle, MoreHorizontal, Eye } from "lucide-react";
import { format } from "date-fns";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseOrder, UserProfile, Supplier } from "@/lib/types";
import { getPurchaseOrders, getUserProfile, getSuppliers, addPurchaseOrder } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { AddPurchaseOrderDialog } from "./add-purchase-order-dialog";
import { ViewPurchaseOrderDialog } from "./view-purchase-order-dialog";

export function PurchaseOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  const fetchPOData = async () => {
    try {
      setLoading(true);
      const [pos, profile, suppliersFromDb] = await Promise.all([
        getPurchaseOrders(),
        user ? getUserProfile(user.uid) : Promise.resolve(null),
        getSuppliers(),
      ]);
      setPurchaseOrders(pos);
      setUserProfile(profile);
      setSuppliers(suppliersFromDb);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch purchase order data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(user) {
        fetchPOData();
    }
  }, [user, toast]);

  const handleAddPurchaseOrder = async (poData: Omit<PurchaseOrder, "id">) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      await addPurchaseOrder(poData);
      toast({ title: "Success", description: "Purchase order created." });
      setIsAddDialogOpen(false);
      await fetchPOData(); // Refresh list
    } catch (error) {
      console.error("Error adding purchase order:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not create purchase order." });
    }
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || "Unknown Supplier";
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          {loading ? (
            <Skeleton className="h-10 w-40" />
           ) : hasWriteAccess ? (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create PO
            </Button>
          ) : null}
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
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">#{po.id.substring(0, 6)}...</TableCell>
                      <TableCell>{getSupplierName(po.supplierId)}</TableCell>
                      <TableCell>
                        {po.createdAt?.toDate ? format(po.createdAt.toDate(), "MMM d, yyyy") : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(po.totalCost)}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'Received' ? 'default' : 'secondary'}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setViewingPO(po)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No purchase orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      
      {hasWriteAccess && (
          <AddPurchaseOrderDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAddPurchaseOrder={handleAddPurchaseOrder}
          />
      )}

      {viewingPO && (
          <ViewPurchaseOrderDialog
            purchaseOrder={viewingPO}
            supplierName={getSupplierName(viewingPO.supplierId)}
            open={!!viewingPO}
            onOpenChange={(isOpen) => !isOpen && setViewingPO(null)}
            hasWriteAccess={hasWriteAccess}
            onSuccess={fetchPOData}
          />
      )}
    </div>
  );
}
