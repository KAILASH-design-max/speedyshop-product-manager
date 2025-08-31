"use client";

import { useEffect, useState } from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Supplier, UserProfile } from "@/lib/types";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, getUserProfile } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddSupplierDialog } from "./add-supplier-dialog";
import { EditSupplierDialog } from "./edit-supplier-dialog";
import { DeleteSupplierAlert } from "./delete-supplier-alert";

export function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const hasWriteAccess = userProfile?.role === 'admin' || userProfile?.role === 'inventory-manager';

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      try {
        setLoading(true);
        const [suppliersFromDb, profile] = await Promise.all([
          getSuppliers(),
          getUserProfile(user.uid)
        ]);
        setSuppliers(suppliersFromDb);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching data:", error);
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch initial supplier data.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [user, toast]);

  const handleAddSupplier = async (newSupplierData: Omit<Supplier, "id">) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to add suppliers." });
       return;
    }
    try {
      const newSupplier = await addSupplier(newSupplierData);
      setSuppliers((prev) => [...prev, newSupplier]);
      toast({ title: "Success", description: "Supplier added successfully." });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add the supplier." });
    }
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
     if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to update suppliers." });
       return;
    }
    try {
      await updateSupplier(updatedSupplier.id, updatedSupplier);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
      );
      setEditingSupplier(null);
      toast({ title: "Success", description: "Supplier updated successfully." });
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update the supplier." });
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!hasWriteAccess) {
       toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete suppliers." });
       return;
    }
    try {
      await deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      setDeletingSupplier(null);
      toast({ title: "Success", description: "Supplier deleted successfully." });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the supplier." });
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Suppliers</h1>
          {hasWriteAccess && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading suppliers...</p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
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
                              <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingSupplier(supplier)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
       <AddSupplierDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddSupplier={handleAddSupplier}
      />
      {editingSupplier && (
        <EditSupplierDialog
          supplier={editingSupplier}
          onUpdateSupplier={handleUpdateSupplier}
          open={!!editingSupplier}
          onOpenChange={(isOpen) => !isOpen && setEditingSupplier(null)}
        />
      )}
      {deletingSupplier && (
        <DeleteSupplierAlert
          supplier={deletingSupplier}
          onDelete={() => handleDeleteSupplier(deletingSupplier.id)}
          open={!!deletingSupplier}
          onOpenChange={(isOpen) => !isOpen && setDeletingSupplier(null)}
        />
      )}
    </div>
  );
}
