"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DealForm, type DealFormValues } from "./deal-form";
import type { Deal } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface EditDealDialogProps {
  deal: Deal;
  onUpdateDeal: (deal: Deal) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to convert Firestore Timestamp or other date formats to a Date object
const toDate = (date: any): Date | undefined => {
  if (!date) return undefined;
  if (date instanceof Date) return date;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return undefined;
}


export function EditDealDialog({ deal, onUpdateDeal, open, onOpenChange }: EditDealDialogProps) {

  const handleSubmit = (values: DealFormValues) => {
    const updatedDeal: Deal = {
      ...deal,
      ...values,
      productIds: values.productIds || [],
      startDate: values.dateRange.from,
      endDate: values.dateRange.to,
    };
    onUpdateDeal(updatedDeal);
  };
  
  const defaultValues = {
    ...deal,
    dateRange: {
      from: toDate(deal.startDate) || new Date(),
      to: toDate(deal.endDate) || new Date(new Date().setDate(new Date().getDate() + 7)),
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit {deal.title}</DialogTitle>
           <DialogDescription>
            Update the deal details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <DealForm onSubmit={handleSubmit} defaultValues={defaultValues} buttonText="Save Changes" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
