"use server";

import { forecastStock } from "@/ai/flows/stock-forecasting";
import type { ForecastStockInput, ForecastStockOutput } from "@/ai/flows/stock-forecasting";

export async function getStockForecast(
  input: ForecastStockInput
): Promise<ForecastStockOutput> {
  try {
    const result = await forecastStock(input);
    return result;
  } catch (error) {
    console.error("Error in getStockForecast:", error);
    // In a real app, you'd have more robust error logging and user feedback.
    return {
      forecastedStockNeeds: "[]",
      analysis:
        "An error occurred while generating the forecast. Please check the historical data format and try again.",
    };
  }
}
