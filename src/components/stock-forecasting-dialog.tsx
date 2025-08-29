"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { getStockForecast } from "@/app/actions";
import type { Product } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface StockForecastingDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockForecastingDialog({ product, open, onOpenChange }: StockForecastingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<{ analysis: string; needs: any[] } | null>(null);
  const { toast } = useToast();

  const handleForecast = async () => {
    setIsLoading(true);
    setForecast(null);
    try {
      const result = await getStockForecast({
        productName: product.name,
        historicalStockData: product.historicalData,
      });
      
      let parsedNeeds = [];
      try {
        parsedNeeds = JSON.parse(result.forecastedStockNeeds);
      } catch (e) {
        // If parsing fails, use a fallback
        parsedNeeds = [{ date: "N/A", level: "N/A", reason: "Could not parse forecast data." }];
      }

      setForecast({ analysis: result.analysis, needs: parsedNeeds });

    } catch (error) {
      console.error("Forecasting failed:", error);
      toast({
        variant: "destructive",
        title: "Forecasting Error",
        description: "Could not generate stock forecast. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Stock Forecast for {product.name}</DialogTitle>
          <DialogDescription>
            Analyze historical data to forecast future stock needs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="font-semibold mb-2">Historical Data</h3>
            <Textarea value={product.historicalData} readOnly className="h-48 text-xs bg-muted/50" />
            <Button onClick={handleForecast} disabled={isLoading} className="w-full mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? "Analyzing..." : "Generate Forecast"}
            </Button>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Forecast Results</h3>
            <div className="space-y-4">
            {isLoading && (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
            )}
            {forecast && (
              <>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <p>{forecast.analysis}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recommended Stock Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        {forecast.needs.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{item.date}:</span>
                                <span className="font-bold">{item.recommended_stock_level || item.level} units</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
              </>
            )}
            {!isLoading && !forecast && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground">
                    <p>Forecast will appear here</p>
                </div>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
