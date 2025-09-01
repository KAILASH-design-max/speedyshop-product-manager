"use server";

import { forecastStock } from "@/ai/flows/stock-forecasting";
import type { ForecastStockInput, ForecastStockOutput } from "@/ai/flows/stock-forecasting";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import type { GenerateProductDescriptionInput, GenerateProductDescriptionOutput } from "@/ai/flows/generate-product-description";
import { generateProductCategory } from "@/ai/flows/generate-product-category";
import type { GenerateProductCategoryInput, GenerateProductCategoryOutput } from "@/ai/flows/generate-product-category";
import { suggestProductName } from "@/ai/flows/suggest-product-name";
import type { SuggestProductNameInput, SuggestProductNameOutput } from "@/ai/flows/suggest-product-name";
import { addProduct, getAuthenticatedUserProfile } from "@/lib/firestore";
import type { Product } from "@/lib/types";
import { generateBusinessInsights } from "@/ai/flows/generate-business-insights";
import type { GenerateBusinessInsightsInput, GenerateBusinessInsightsOutput } from "@/ai/flows/generate-business-insights";


export async function getStockForecast(
  input: ForecastStockInput
): Promise<ForecastStockOutput> {
  try {
    await getAuthenticatedUserProfile(); // Secure: All logged-in users can forecast
    const result = await forecastStock(input);
    return result;
  } catch (error: any) {
    console.error("Error in getStockForecast:", error);
    return {
      forecastedStockNeeds: "[]",
      analysis: error.message || "An error occurred while generating the forecast.",
    };
  }
}

export async function getAIProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  try {
    await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
    const result = await generateProductDescription(input);
    return result;
  } catch (error: any) {
    console.error("Error in getAIProductDescription:", error);
    return {
      description: error.message || "Sorry, we couldn't generate a description at this time.",
    };
  }
}

export async function getAIProductCategory(
  input: GenerateProductCategoryInput
): Promise<GenerateProductCategoryOutput> {
  try {
    await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
    const result = await generateProductCategory(input);
    return result;
  } catch (error: any) {
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
    await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
    const result = await suggestProductName(input);
    return result;
  } catch (error: any) {
    console.error("Error in getAIProductName:", error);
    return {
      productName: "",
    };
  }
}

export async function bulkAddProducts(products: Omit<Product, "id" | "historicalData">[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
    const promises = products.map(product => addProduct(product));
    await Promise.all(promises);
    return { success: true, count: products.length };
  } catch (error: any) {
    console.error("Error in bulkAddProducts:", error);
    return { success: false, count: 0, error: error.message || "An unexpected error occurred during the bulk upload." };
  }
}

export async function getBusinessInsights(
  input: GenerateBusinessInsightsInput
): Promise<GenerateBusinessInsightsOutput> {
  try {
    await getAuthenticatedUserProfile(); // Secure: All logged-in users can view reports
    const result = await generateBusinessInsights(input);
    return result;
  } catch (error: any) {
    console.error("Error in getBusinessInsights:", error);
    return {
      businessSummary: error.message || "An error occurred while generating the business summary.",
      topPerformingProducts: [],
      recommendations: ["Could not generate recommendations due to an error."],
    };
  }
}
