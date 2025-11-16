"use client";

import { useEffect, useState } from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Deal, UserProfile } from "@/lib/types";
import { getDeals, addDeal, updateDeal, deleteDeal, getUserProfile } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddDealDialog } from "./add-deal-dialog";
import { EditDealDialog } from "./edit-deal-dialog";
import { DeleteDealAlert } from "./delete-deal-alert";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Skeleton } from "./ui/skeleton";

// Helper to convert Firestore Timestamp or other date formats to a Date object
const toDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return null;
}

export function DealsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      try {
        setLoading(true);
        const [dealsFromDb, profile] = await Promise.all([
          getDeals(),
          getUserProfile(user.uid)
        ]);
        setDeals(dealsFromDb);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching data:", error);
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch initial deal data.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [user, toast]);

  const handleAddDeal = async (newDealData: Omit<Deal, "id">) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      const newDeal = await addDeal(newDealData);
      setDeals((prev) => [...prev, newDeal]);
      toast({ title: "Success", description: "Deal created successfully." });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding deal:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not create the deal." });
    }
  };

  const handleUpdateDeal = async (updatedDeal: Deal) => {
     if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      await updateDeal(updatedDeal.id, updatedDeal);
      setDeals((prev) =>
        prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d))
      );
      setEditingDeal(null);
      toast({ title: "Success", description: "Deal updated successfully." });
    } catch (error) {
      console.error("Error updating deal:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update the deal." });
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      await deleteDeal(dealId);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      setDeletingDeal(null);
      toast({ title: "Success", description: "Deal deleted successfully." });
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the deal." });
    }
  }
  
  const handleToggleActive = async (deal: Deal) => {
    if (!hasWriteAccess) {
      toast({ variant: "destructive", title: "Permission Denied" });
      return;
    }
    try {
      const updatedDeal = { ...deal, isActive: !deal.isActive };
      await updateDeal(deal.id, { isActive: updatedDeal.isActive });
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? updatedDeal : d))
      );
      toast({ title: "Success", description: `Deal ${updatedDeal.isActive ? 'activated' : 'deactivated'}.` });
    } catch (error) {
       console.error("Error toggling deal status:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not update the deal status." });
    }
  };

  const getStatus = (deal: Deal) => {
    const now = new Date();
    const startDate = toDate(deal.startDate);
    const endDate = toDate(deal.endDate);

    if (!startDate || !endDate) return <Badge variant="secondary">Unscheduled</Badge>;

    if (now < startDate) return <Badge variant="outline">Scheduled</Badge>;
    if (now > endDate) return <Badge variant="secondary">Expired</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-500/80">Active</Badge>;
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Deals & Promotions</h1>
          {loading ? (
            <Skeleton className="h-10 w-40" />
           ) : hasWriteAccess ? (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Deal
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="border rounded-lg p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length > 0 ? (
                  deals.map((deal) => {
                    const startDate = toDate(deal.startDate);
                    const endDate = toDate(deal.endDate);
                    return (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.title}</TableCell>
                        <TableCell>
                          {startDate && endDate ? (
                            `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                          ) : ('-')}
                        </TableCell>
                        <TableCell>{getStatus(deal)}</TableCell>
                        <TableCell>
                          <Switch
                              checked={deal.isActive}
                              onCheckedChange={() => handleToggleActive(deal)}
                              disabled={!hasWriteAccess}
                              aria-label="Toggle deal activation"
                          />
                        </TableCell>
                        <TableCell>
                          {hasWriteAccess && (
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingDeal(deal)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No deals found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
       <AddDealDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddDeal={handleAddDeal}
      />
      {editingDeal && (
        <EditDealDialog
          deal={editingDeal}
          onUpdateDeal={handleUpdateDeal}
          open={!!editingDeal}
          onOpenChange={(isOpen) => !isOpen && setEditingDeal(null)}
        />
      )}
      {deletingDeal && (
        <DeleteDealAlert
          deal={deletingDeal}
          onDelete={() => handleDeleteDeal(deletingDeal.id)}
          open={!!deletingDeal}
          onOpenChange={(isOpen) => !isOpen && setDeletingDeal(null)}
        />
      )}
    </div>
  );
}
