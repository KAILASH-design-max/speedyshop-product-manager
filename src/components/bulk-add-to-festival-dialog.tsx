
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
import type { Festival } from "@/lib/types";
import { getFestivals } from "@/lib/firestore";
import { bulkUpdateProductsAction } from "@/app/actions";

interface BulkAddToFestivalDialogProps {
  productIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkAddToFestivalDialog({
  productIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkAddToFestivalDialogProps) {
  const { toast } = useToast();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestival, setSelectedFestival] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchFestivals() {
      if (open) {
        const festivalsFromDb = await getFestivals();
        setFestivals(festivalsFromDb.filter(f => f.isActive)); // Only show active festivals
      }
    }
    fetchFestivals();
  }, [open]);

  const handleSave = async () => {
    if (!selectedFestival) {
      toast({ variant: "destructive", description: "Please select a festival." });
      return;
    }
    setIsSaving(true);
    const result = await bulkUpdateProductsAction(productIds, 'festival', selectedFestival);

    if (result.success) {
      toast({
        title: "Success",
        description: `${productIds.length} products added to the festival campaign.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to update festival.",
      });
    }
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Festival Campaign</DialogTitle>
          <DialogDescription>
            Select a festival to add the {productIds.length} selected products to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedFestival} onValueChange={setSelectedFestival}>
            <SelectTrigger>
              <SelectValue placeholder="Select an active festival..." />
            </SelectTrigger>
            <SelectContent>
              {festivals.map((festival) => (
                <SelectItem key={festival.id} value={festival.id}>
                  {festival.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedFestival}>
            {isSaving ? "Adding..." : "Add to Festival"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
