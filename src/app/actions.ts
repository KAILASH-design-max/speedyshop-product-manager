"use server";

import { forecastStock } from "@/ai/flows/stock-forecasting";
import type { ForecastStockInput, ForecastStockOutput } from "@/ai/flows/stock-forecasting";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import type { GenerateProductDescriptionInput, GenerateProductDescriptionOutput } from "@/ai/flows/generate-product-description";
import { generateProductCategory } from "@/ai/flows/generate-product-category";
import type { GenerateProductCategoryInput, GenerateProductCategoryOutput } from "@/ai/flows/generate-product-category";
import { suggestProductName } from "@/ai/flows/suggest-product-name";
import type { SuggestProductNameInput, SuggestProductNameOutput } from "@/ai/flows/suggest-product-name";


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

export async function getAIProductCategory(
  input: GenerateProductCategoryInput
): Promise<GenerateProductCategoryOutput> {
  try {
    const result = await generateProductCategory(input);
    return result;
  } catch (error) {
    console.error("Error in getAIProductCategory:", error);
    return {
      category: "",
      subcategory: "",
    };
  }
}

export async function getAIProductName(
  input: SuggestProductNameInput
): Promise<SuggestProductNameOutput> {
  try {
    const result = await suggestProductName(input);
    return result;
  } catch (error) {
    console.error("Error in getAIProductName:", error);
    return {
      productName: "",
    };
  }
}
