
"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
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

const PrintablePO = ({ purchaseOrder, supplierName, componentRef }: { purchaseOrder: PurchaseOrder, supplierName: string, componentRef: React.Ref<HTMLDivElement> }) => {
    return (
        <div ref={componentRef} className="p-4 print:p-0">
             <div className="print:hidden">
                <DialogHeader>
                    <DialogTitle>Purchase Order Details</DialogTitle>
                    <DialogDescription>PO Number: #{purchaseOrder.id.substring(0, 6)}...</DialogDescription>
                </DialogHeader>
            </div>
            <div className="hidden print:block mb-8">
                 <h1 className="text-2xl font-bold">Purchase Order</h1>
                 <p className="text-sm text-muted-foreground">PO Number: #{purchaseOrder.id}</p>
            </div>


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
                     <Badge variant={purchaseOrder.status === 'Received' ? 'default' : 'secondary'} className="print:border print:border-gray-300">
                        {purchaseOrder.status}
                    </Badge>
                </div>
            </div>
            
            <Separator />
            
            <div className="py-4">
                <h4 className="font-semibold mb-2 print:text-lg">Items</h4>
                <div className="border rounded-md print:border-gray-300">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Product (Variant)</TableHead>
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
                    <div className="text-lg print:text-xl">
                        <span className="font-semibold">Total Cost: </span>
                        <span className="font-bold text-primary">{formatCurrency(purchaseOrder.totalCost)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export function ViewPurchaseOrderDialog({ purchaseOrder, supplierName, open, onOpenChange, hasWriteAccess, onSuccess }: ViewPurchaseOrderDialogProps) {
    const { toast } = useToast();
    const [isReceiving, setIsReceiving] = useState(false);
    const printableComponentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printableComponentRef.current,
        documentTitle: `purchase-order-${purchaseOrder.id}`,
    });

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
            <DialogContent className="sm:max-w-2xl p-0">
                <PrintablePO 
                    purchaseOrder={purchaseOrder} 
                    supplierName={supplierName} 
                    componentRef={printableComponentRef} 
                />

                <DialogFooter className="p-6 pt-0 border-t print:hidden">
                    <div className="flex justify-between w-full">
                        <div>
                             <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print PO
                            </Button>
                        </div>
                        <div className="flex gap-2">
                             {hasWriteAccess && purchaseOrder.status === 'Pending' && (
                                <Button onClick={handleReceiveOrder} disabled={isReceiving}>
                                    {isReceiving ? "Receiving..." : "Mark as Received & Update Stock"}
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
