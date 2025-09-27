"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FestivalForm, type FestivalFormValues } from "./festival-form";
import type { Festival } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface EditFestivalDialogProps {
  festival: Festival;
  onUpdateFestival: (festival: Festival) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFestivalDialog({ festival, onUpdateFestival, open, onOpenChange }: EditFestivalDialogProps) {

  const handleSubmit = (values: FestivalFormValues) => {
    const updatedFestival: Festival = {
      ...festival,
      ...values,
      productIds: values.productIds || [],
      startDate: values.dateRange.from,
      endDate: values.dateRange.to,
    };
    onUpdateFestival(updatedFestival);
  };
  
  const defaultValues = {
    ...festival,
    dateRange: {
      from: festival.startDate?.toDate(),
      to: festival.endDate?.toDate(),
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit {festival.title}</DialogTitle>
           <DialogDescription>
            Update the festival details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <FestivalForm onSubmit={handleSubmit} defaultValues={defaultValues} buttonText="Save Changes" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
