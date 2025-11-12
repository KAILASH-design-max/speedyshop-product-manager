
"use client";

import { useRef } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import type { UserProfile } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";

interface UserBarcodeDialogProps {
  userProfile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserBarcodeDialog({ userProfile, open, onOpenChange }: UserBarcodeDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${userProfile.name}-barcode`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode for {userProfile.name}</DialogTitle>
          <DialogDescription>
            This barcode uniquely identifies you in the system.
          </DialogDescription>
        </DialogHeader>
        
        <div ref={componentRef} className="py-4 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">{userProfile.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">UID: {userProfile.uid}</p>
            <Barcode value={userProfile.uid} />
        </div>

        <DialogFooter>
            <Button onClick={handlePrint} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Print Barcode
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
