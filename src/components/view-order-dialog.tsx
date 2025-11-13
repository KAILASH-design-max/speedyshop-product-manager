
"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateOrderStatus } from "@/lib/firestore";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface ViewOrderDialogProps {
  order: Order;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasWriteAccess: boolean;
  onSuccess: () => void;
}

const orderStatuses: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export function ViewOrderDialog({ order, customerName, open, onOpenChange, hasWriteAccess, onSuccess }: ViewOrderDialogProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<Order['status']>(order.status);

    const handleStatusChange = async () => {
        setIsSaving(true);
        try {
            await updateOrderStatus(order.id, currentStatus);
            toast({ title: "Success", description: "Order status updated successfully." });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
             toast({ variant: "destructive", title: "Error", description: "Could not update order status." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Shipped': return 'secondary';
            case 'Processing': return 'secondary';
            case 'Pending': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'secondary';
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                 <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>Order ID: #{order.id.substring(0, 6)}...</DialogDescription>
                </DialogHeader>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm py-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold mb-2">Customer Details</h4>
                        <p><span className="text-muted-foreground">Name:</span> {customerName}</p>
                        <p><span className="text-muted-foreground">Address:</span> {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.postalCode}`}</p>
                         <p><span className="text-muted-foreground">Phone:</span> {order.phoneNumber}</p>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold mb-2">Order Information</h4>
                        <p><span className="text-muted-foreground">Date:</span> {order.orderDate?.toDate ? format(order.orderDate.toDate(), "MMM d, yyyy") : '-'}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span> 
                            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                        </div>
                         <p><span className="text-muted-foreground">Payment:</span> {order.paymentMethod}</p>
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
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-end mt-4 text-lg">
                        <span className="font-semibold">Total: </span>
                        <span className="font-bold text-primary ml-2">{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>

                <DialogFooter>
                     {hasWriteAccess ? (
                        <div className="flex justify-between w-full items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Update Status:</span>
                                <Select value={currentStatus} onValueChange={(value) => setCurrentStatus(value as Order['status'])}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderStatuses.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleStatusChange} disabled={isSaving || currentStatus === order.status}>
                                    {isSaving ? "Saving..." : "Save Status"}
                                </Button>
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
