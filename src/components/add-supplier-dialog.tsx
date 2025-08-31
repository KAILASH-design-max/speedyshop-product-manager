"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SupplierForm, type SupplierFormValues } from "./supplier-form";
import type { Supplier } from "@/lib/types";

interface AddSupplierDialogProps {
  onAddSupplier: (supplier: Omit<Supplier, "id">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierDialog({ onAddSupplier, open, onOpenChange }: AddSupplierDialogProps) {
  const handleSubmit = (values: SupplierFormValues) => {
    onAddSupplier(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new supplier.
          </DialogDescription>
        </DialogHeader>
        <SupplierForm onSubmit={handleSubmit} buttonText="Add Supplier" />
      </DialogContent>
    </Dialog>
  );
}
