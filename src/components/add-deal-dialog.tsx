"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DealForm, type DealFormValues } from "./deal-form";
import type { Deal } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface AddDealDialogProps {
  onAddDeal: (deal: Omit<Deal, "id">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDealDialog({ onAddDeal, open, onOpenChange }: AddDealDialogProps) {
  
  const handleSubmit = (values: DealFormValues) => {
    onAddDeal({
        ...values,
        productIds: values.productIds || [],
        startDate: values.dateRange.from,
        endDate: values.dateRange.to,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Fill in the details below to launch a new promotion.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <DealForm onSubmit={handleSubmit} buttonText="Create Deal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
