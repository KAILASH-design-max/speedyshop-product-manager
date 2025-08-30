"use client";

import { MoreVertical, Edit, Trash2, TrendingUp, Package, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';
import { useState } from "react";


interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: () => void;
  onForecast: () => void;
  hasWriteAccess: boolean;
}

export function ProductCard({ product, onEdit, onDelete, onUpdateStock, onForecast, hasWriteAccess }: ProductCardProps) {
  const isLowStock = product.stock <= product.lowStockThreshold;
  const stockPercentage = Math.min((product.stock / (product.lowStockThreshold * 2)) * 100, 100);
  const initialImageUrl = product.images && product.images.length > 0 ? product.images[0] : `https://picsum.photos/seed/${product.id}/400/300`;

  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  const handleImageError = () => {
    setImageUrl(`https://picsum.photos/seed/${product.id}/400/300`);
  };


  return (
    <Card className={cn("flex flex-col", isLowStock && "border-destructive")}>
       <CardHeader className="p-0 relative h-40">
        <Image
          src={imageUrl}
          alt={product.name}
          width={400}
          height={300}
          className="object-cover w-full h-full rounded-t-lg"
          data-ai-hint={`${product.category} ${product.subcategory}`}
          onError={handleImageError}
        />
        <div className="absolute top-2 right-2">
            {hasWriteAccess && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/70 hover:bg-background/90">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={onForecast}><TrendingUp className="mr-2 h-4 w-4" />Forecast</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <div className="p-4 flex flex-col flex-grow">
        <div>
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <CardDescription>ID: {product.id.substring(0,6)}...</CardDescription>
        </div>
        <CardContent className="flex-grow space-y-4 p-0 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-3xl font-bold">
              <Package className="mr-2 h-7 w-7 text-primary" />
              {product.stock}
            </div>
            {isLowStock && (
              <div className="flex items-center text-destructive text-sm font-medium">
                <AlertTriangle className="mr-1 h-4 w-4" />
                Low Stock
              </div>
            )}
          </div>
          <div>
              <div className="text-xs text-muted-foreground flex justify-between mb-1">
                  <span>Threshold: {product.lowStockThreshold}</span>
                  <span>Target: {product.lowStockThreshold * 2}</span>
              </div>
              <Progress value={stockPercentage} className={isLowStock ? "[&>div]:bg-destructive" : ""} />
          </div>
        </CardContent>
        <CardFooter className="p-0 pt-4">
          <Button className="w-full" onClick={onUpdateStock} disabled={!hasWriteAccess}>Update Stock</Button>
        </CardFooter>
      </div>
    </Card>
  );
}
