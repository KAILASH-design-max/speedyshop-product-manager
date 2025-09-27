
"use client";

import { useEffect, useState } from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Festival, UserProfile } from "@/lib/types";
import { getFestivals, addFestival, updateFestival, deleteFestival, getUserProfile } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddFestivalDialog } from "./add-festival-dialog";
import { EditFestivalDialog } from "./edit-festival-dialog";
import { DeleteFestivalAlert } from "./delete-festival-alert";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Skeleton } from "./ui/skeleton";
import type { Timestamp } from "firebase/firestore";

// Helper to convert Firestore Timestamp or other date formats to a Date object
const toDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return null;
}

export function FestivalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [deletingFestival, setDeletingFestival] = useState<Festival | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      try {
        setLoading(true);
        const [festivalsFromDb, profile] = await Promise.all([
          getFestivals(),
          getUserProfile(user.uid)
        ]);
        setFestivals(festivalsFromDb);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching data:", error);
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch initial festival data.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [user, toast]);

  const handleAddFestival = async (newFestivalData: Omit<Festival, "id">) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      const newFestival = await addFestival(newFestivalData);
      setFestivals((prev) => [...prev, newFestival]);
      toast({ title: "Success", description: "Festival created successfully." });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding festival:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not create the festival." });
    }
  };

  const handleUpdateFestival = async (updatedFestival: Festival) => {
     if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      await updateFestival(updatedFestival.id, updatedFestival);
      setFestivals((prev) =>
        prev.map((f) => (f.id === updatedFestival.id ? updatedFestival : f))
      );
      setEditingFestival(null);
      toast({ title: "Success", description: "Festival updated successfully." });
    } catch (error) {
      console.error("Error updating festival:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update the festival." });
    }
  }

  const handleDeleteFestival = async (festivalId: string) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied" });
       return;
    }
    try {
      await deleteFestival(festivalId);
      setFestivals((prev) => prev.filter((f) => f.id !== festivalId));
      setDeletingFestival(null);
      toast({ title: "Success", description: "Festival deleted successfully." });
    } catch (error) {
      console.error("Error deleting festival:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the festival." });
    }
  }
  
  const handleToggleActive = async (festival: Festival) => {
    if (!hasWriteAccess) {
      toast({ variant: "destructive", title: "Permission Denied" });
      return;
    }
    try {
      const updatedFestival = { ...festival, isActive: !festival.isActive };
      await updateFestival(festival.id, { isActive: updatedFestival.isActive });
      setFestivals((prev) =>
        prev.map((f) => (f.id === festival.id ? updatedFestival : f))
      );
      toast({ title: "Success", description: `Festival ${updatedFestival.isActive ? 'activated' : 'deactivated'}.` });
    } catch (error) {
       console.error("Error toggling festival status:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not update the festival status." });
    }
  };

  const getStatus = (festival: Festival) => {
    const now = new Date();
    const startDate = toDate(festival.startDate);
    const endDate = toDate(festival.endDate);

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
          <h1 className="text-3xl font-bold">Festival Campaigns</h1>
          {loading ? (
            <Skeleton className="h-10 w-40" />
           ) : hasWriteAccess ? (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Festival
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
                {festivals.length > 0 ? (
                  festivals.map((festival) => {
                    const startDate = toDate(festival.startDate);
                    const endDate = toDate(festival.endDate);
                    return (
                      <TableRow key={festival.id}>
                        <TableCell className="font-medium">{festival.title}</TableCell>
                        <TableCell>
                          {startDate && endDate ? (
                            `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                          ) : ('-')}
                        </TableCell>
                        <TableCell>{getStatus(festival)}</TableCell>
                        <TableCell>
                          <Switch
                              checked={festival.isActive}
                              onCheckedChange={() => handleToggleActive(festival)}
                              disabled={!hasWriteAccess}
                              aria-label="Toggle campaign activation"
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
                                <DropdownMenuItem onClick={() => setEditingFestival(festival)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingFestival(festival)}>
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
                      No festival campaigns found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
       <AddFestivalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddFestival={handleAddFestival}
      />
      {editingFestival && (
        <EditFestivalDialog
          festival={editingFestival}
          onUpdateFestival={handleUpdateFestival}
          open={!!editingFestival}
          onOpencha nge={(isOpen) => !isOpen && setEditingFestival(null)}
        />
      )}
      {deletingFestival && (
        <DeleteFestivalAlert
          festival={deletingFestival}
          onDelete={() => handleDeleteFestival(deletingFestival.id)}
          open={!!deletingFestival}
          onOpenChange={(isOpen) => !isOpen && setDeletingFestival(null)}
        />
      )}
    </div>
  );
}
