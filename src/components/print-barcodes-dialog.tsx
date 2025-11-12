
"use client";

import { useRef } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import type { Product } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface PrintBarcodesDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintBarcodesDialog({ products, open, onOpenChange }: PrintBarcodesDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `product-barcodes`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Product Barcodes</DialogTitle>
          <DialogDescription>
            A printable sheet of barcodes for the {products.length} selected products. Use the print button below.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div ref={componentRef} className="p-4 grid grid-cols-2 md:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="flex flex-col items-center justify-center text-center break-words p-2 border rounded-lg">
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">ID: {product.id}</p>
                  <Barcode value={product.id} height={50} width={1.5} fontSize={12} />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
            <Button onClick={handlePrint} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Print {products.length} Barcodes
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
