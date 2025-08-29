"use server";

import { forecastStock } from "@/ai/flows/stock-forecasting";
import type { ForecastStockInput, ForecastStockOutput } from "@/ai/flows/stock-forecasting";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import type { GenerateProductDescriptionInput, GenerateProductDescriptionOutput } from "@/ai/flows/generate-product-description";


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

export async function getAIProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  try {
    const result = await generateProductDescription(input);
    return result;
  } catch (error) {
    console.error("Error in getAIProductDescription:", error);
    return {
      description: "Sorry, we couldn't generate a description at this time. Please try again.",
    };
  }
}
