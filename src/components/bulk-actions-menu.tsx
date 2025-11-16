
"use client";

import { useState } from "react";
import { SlidersHorizontal, Trash2, Tag, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkDeleteAlertDialog } from "./bulk-delete-alert-dialog";
import { BulkAddToDealDialog } from "./bulk-add-to-deal-dialog";
import { BulkAddToFestivalDialog } from "./bulk-add-to-festival-dialog";

interface BulkActionsMenuProps {
  selectedIds: string[];
  onActionSuccess: () => void;
}

export function BulkActionsMenu({ selectedIds, onActionSuccess }: BulkActionsMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddToDealOpen, setIsAddToDealOpen] = useState(false);
  const [isAddToFestivalOpen, setIsAddToFestivalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Actions ({selectedIds.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAddToDealOpen(true)}>
            <Tag className="mr-2 h-4 w-4" />
            <span>Add to Deal</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAddToFestivalOpen(true)}>
            <Percent className="mr-2 h-4 w-4" />
            <span>Add to Festival</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Selected</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkDeleteAlertDialog
        productIds={selectedIds}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={onActionSuccess}
      />

      <BulkAddToDealDialog
        productIds={selectedIds}
        open={isAddToDealOpen}
        onOpenChange={setIsAddToDealOpen}
        onSuccess={onActionSuccess}
      />

      <BulkAddToFestivalDialog
        productIds={selectedIds}
        open={isAddToFestivalOpen}
        onOpenChange={setIsAddToFestivalOpen}
        onSuccess={onActionSuccess}
      />
    </>
  );
}
