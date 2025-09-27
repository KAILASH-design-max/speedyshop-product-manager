"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FestivalForm, type FestivalFormValues } from "./festival-form";
import type { Festival } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface AddFestivalDialogProps {
  onAddFestival: (festival: Omit<Festival, "id">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFestivalDialog({ onAddFestival, open, onOpenChange }: AddFestivalDialogProps) {
  
  const handleSubmit = (values: FestivalFormValues) => {
    onAddFestival({
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
          <DialogTitle>Create New Festival Campaign</DialogTitle>
          <DialogDescription>
            Fill in the details below to launch a new festival promotion.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <FestivalForm onSubmit={handleSubmit} buttonText="Create Festival" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
