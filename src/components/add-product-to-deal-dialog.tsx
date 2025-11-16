
"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Deal, Product } from "@/lib/types";
import { getDeals, updateDeal } from "@/lib/firestore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface AddProductToDealDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductToDealDialog({ product, open, onOpenChange }: AddProductToDealDialogProps) {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDeals() {
      if (!open) return;
      try {
        setLoading(true);
        const allDeals = await getDeals();
        setDeals(allDeals);
        // Pre-select deals that already contain this product
        const initialSelected = new Set<string>();
        allDeals.forEach(deal => {
          if (deal.productIds.includes(product.id)) {
            initialSelected.add(deal.id);
          }
        });
        setSelectedDealIds(initialSelected);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch deals." });
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [open, product.id, toast]);

  const handleToggleDeal = (dealId: string) => {
    setSelectedDealIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const promises: Promise<void>[] = [];

    deals.forEach(deal => {
      const isSelected = selectedDealIds.has(deal.id);
      const alreadyInDeal = deal.productIds.includes(product.id);

      if (isSelected && !alreadyInDeal) {
        // Add product to deal
        const updatedProductIds = [...deal.productIds, product.id];
        promises.push(updateDeal(deal.id, { productIds: updatedProductIds }));
      } else if (!isSelected && alreadyInDeal) {
        // Remove product from deal
        const updatedProductIds = deal.productIds.filter(id => id !== product.id);
        promises.push(updateDeal(deal.id, { productIds: updatedProductIds }));
      }
    });

    try {
      await Promise.all(promises);
      toast({ title: "Success", description: "Deal associations have been updated." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update deals." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add "{product.name}" to Deals</DialogTitle>
          <DialogDescription>
            Select the deals you want to include this product in.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded-md my-4">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deals.length > 0 ? (
              deals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => handleToggleDeal(deal.id)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted",
                    selectedDealIds.has(deal.id) && "bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">{deal.title}</span>
                  {selectedDealIds.has(deal.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No active deals found.
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
