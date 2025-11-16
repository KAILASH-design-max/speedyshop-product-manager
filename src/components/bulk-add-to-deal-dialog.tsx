
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Deal } from "@/lib/types";
import { getDeals } from "@/lib/firestore";
import { bulkUpdateProductsAction } from "@/app/actions";

interface BulkAddToDealDialogProps {
  productIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkAddToDealDialog({
  productIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkAddToDealDialogProps) {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDeals() {
      if (open) {
        const dealsFromDb = await getDeals();
        setDeals(dealsFromDb.filter(d => d.isActive)); // Only show active deals
      }
    }
    fetchDeals();
  }, [open]);

  const handleSave = async () => {
    if (!selectedDeal) {
      toast({ variant: "destructive", description: "Please select a deal." });
      return;
    }
    setIsSaving(true);
    const result = await bulkUpdateProductsAction(productIds, 'deal', selectedDeal);
    if (result.success) {
      toast({
        title: "Success",
        description: `${productIds.length} products added to the deal.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to update deal.",
      });
    }
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Deal</DialogTitle>
          <DialogDescription>
            Select a deal to add the {productIds.length} selected products to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedDeal} onValueChange={setSelectedDeal}>
            <SelectTrigger>
              <SelectValue placeholder="Select an active deal..." />
            </SelectTrigger>
            <SelectContent>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedDeal}>
            {isSaving ? "Adding..." : "Add to Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
