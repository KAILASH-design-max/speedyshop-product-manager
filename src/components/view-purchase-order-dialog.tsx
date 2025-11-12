
"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { PurchaseOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { receivePurchaseOrderAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface ViewPurchaseOrderDialogProps {
  purchaseOrder: PurchaseOrder;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasWriteAccess: boolean;
  onSuccess: () => void;
}

export function ViewPurchaseOrderDialog({ purchaseOrder, supplierName, open, onOpenChange, hasWriteAccess, onSuccess }: ViewPurchaseOrderDialogProps) {
    const { toast } = useToast();
    const [isReceiving, setIsReceiving] = useState(false);

    const handleReceiveOrder = async () => {
        setIsReceiving(true);
        const result = await receivePurchaseOrderAction(purchaseOrder);
        if (result.success) {
            toast({ title: "Success", description: "Purchase order marked as received and stock has been updated." });
            onSuccess(); // Refresh the PO list
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
        setIsReceiving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Purchase Order Details</DialogTitle>
                <DialogDescription>PO Number: #{purchaseOrder.id.substring(0, 6)}...</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 text-sm py-4">
                <div>
                    <h4 className="font-semibold mb-1">Supplier</h4>
                    <p className="text-muted-foreground">{supplierName}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Creation Date</h4>
                    <p className="text-muted-foreground">{purchaseOrder.createdAt?.toDate ? format(purchaseOrder.createdAt.toDate(), "MMM d, yyyy") : '-'}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Status</h4>
                     <Badge variant={purchaseOrder.status === 'Received' ? 'default' : 'secondary'}>
                        {purchaseOrder.status}
                    </Badge>
                </div>
            </div>
            
            <Separator />
            
            <div className="py-4">
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Cost/Item</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrder.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.costPerItem)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.costPerItem)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="flex justify-end mt-4">
                    <div className="text-lg">
                        <span className="font-semibold">Total Cost: </span>
                        <span className="font-bold text-primary">{formatCurrency(purchaseOrder.totalCost)}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                {hasWriteAccess && purchaseOrder.status === 'Pending' && (
                     <Button onClick={handleReceiveOrder} disabled={isReceiving}>
                        {isReceiving ? "Receiving..." : "Mark as Received & Update Stock"}
                    </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>

        </DialogContent>
        </Dialog>
    );
}
