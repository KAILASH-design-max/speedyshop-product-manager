
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import Papa from "papaparse";


interface BulkUploadDialogProps {
  children: React.ReactNode;
  onUpload: (products: Omit<Product, "id" | "historicalData">[]) => void;
}

const requiredHeaders = ["name", "stock", "price", "category", "lowStockThreshold"];
const optionalHeaders = ["imageUrl", "subcategory", "description", "weight", "origin", "status", "originalPrice"];


export function BulkUploadDialog({ children, onUpload }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
      });
      return;
    }

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            toast({
                variant: "destructive",
                title: "Invalid CSV Format",
                description: `The following required columns are missing: ${missingHeaders.join(", ")}`,
            });
            setIsUploading(false);
            return;
        }

        const products: Omit<Product, "id" | "historicalData">[] = results.data.map((row: any) => {
            const price = parseFloat(row.price) || 0;
            const stock = parseInt(row.stock, 10) || 0;
            const lowStockThreshold = parseInt(row.lowStockThreshold, 10) || 10;
            const originalPrice = row.originalPrice ? parseFloat(row.originalPrice) : undefined;

            return {
                name: row.name || "",
                category: row.category || "",
                images: row.imageUrl ? [row.imageUrl] : [],
                subcategory: row.subcategory || "",
                description: row.description || "",
                weight: row.weight || "",
                origin: row.origin || "",
                status: row.status === "inactive" ? "inactive" : "active",
                isVariable: false,
                variants: [{
                    id: "default-variant",
                    name: "Default",
                    price,
                    stock,
                    lowStockThreshold,
                    originalPrice
                }]
            };
        });

        onUpload(products);
        setIsUploading(false);
        setFile(null);
        setOpen(false);
      },
      error: (error: any) => {
        toast({
            variant: "destructive",
            title: "Parsing Error",
            description: error.message,
        });
        setIsUploading(false);
      }
    });

  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Product Upload</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple products at once. Make sure your file has the correct columns.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center justify-center w-full">
                 <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                       {file ? (
                        <>
                          <FileText className="w-10 h-10 mb-3 text-primary" />
                          <p className="mb-2 text-sm text-foreground"><span className="font-semibold">{file.name}</span></p>
                          <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                        </>
                       ) : (
                        <>
                           <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                           <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                           <p className="text-xs text-muted-foreground">CSV file (max 5MB)</p>
                        </>
                       )}
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                </label>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">CSV Format Requirements:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                 <li><CheckCircle className="inline-block w-3 h-3 mr-1.5 text-green-500" /><strong>Required Columns:</strong> {requiredHeaders.join(", ")}</li>
                 <li><XCircle className="inline-block w-3 h-3 mr-1.5 text-destructive" /><strong>Optional Columns:</strong> {optionalHeaders.join(", ")}</li>
              </ul>
            </div>
        </div>
        <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
          {isUploading ? "Uploading..." : "Upload and Add Products"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
