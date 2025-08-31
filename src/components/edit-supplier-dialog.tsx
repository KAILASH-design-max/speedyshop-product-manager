"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SupplierForm, type SupplierFormValues } from "./supplier-form";
import type { Supplier } from "@/lib/types";

interface EditSupplierDialogProps {
  supplier: Supplier;
  onUpdateSupplier: (supplier: Supplier) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupplierDialog({ supplier, onUpdateSupplier, open, onOpenChange }: EditSupplierDialogProps) {
  const handleSubmit = (values: SupplierFormValues) => {
    const updatedSupplier = {
      ...supplier,
      ...values,
    };
    onUpdateSupplier(updatedSupplier);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {supplier.name}</DialogTitle>
           <DialogDescription>
            Update the supplier details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <SupplierForm onSubmit={handleSubmit} defaultValues={supplier} buttonText="Save Changes" />
      </DialogContent>
    </Dialog>
  );
}
