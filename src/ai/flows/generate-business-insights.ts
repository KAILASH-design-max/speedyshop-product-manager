'use server';
/**
 * @fileOverview Generates business insights using AI based on product and order data.
 *
 * - generateBusinessInsights - A function that handles the insight generation.
 * - GenerateBusinessInsightsInput - The input type for the function.
 * - GenerateBusinessInsightsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBusinessInsightsInputSchema = z.object({
  productData: z.string().describe('A JSON string of all product data, including id, name, category, price, and stock.'),
  orderData: z.string().describe('A JSON string of all order data, including id, items, totalAmount, and orderDate.'),
});
export type GenerateBusinessInsightsInput = z.infer<typeof GenerateBusinessInsightsInputSchema>;

const GenerateBusinessInsightsOutputSchema = z.object({
    businessSummary: z.string().describe("A concise, high-level summary of the business's performance based on the provided data."),
    topPerformingProducts: z.array(z.object({
        productName: z.string().describe("The name of the top-performing product."),
        reason: z.string().describe("A brief explanation of why this product is considered a top performer (e.g., highest revenue, most units sold).")
    })).describe("A list of the top 3-5 performing products."),
    recommendations: z.array(z.string()).describe("A list of 3 actionable, strategic recommendations for the business (e.g., 'Restock Product X', 'Consider a promotion for Category Y', 'Bundle Product A and B')."),
});
export type GenerateBusinessInsightsOutput = z.infer<typeof GenerateBusinessInsightsOutputSchema>;

export async function generateBusinessInsights(
  input: GenerateBusinessInsightsInput
): Promise<GenerateBusinessInsightsOutput> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessInsightsPrompt',
  input: { schema: GenerateBusinessInsightsInputSchema },
  output: { schema: GenerateBusinessInsightsOutputSchema },
  prompt: `You are a business intelligence analyst for an e-commerce company. Analyze the following product and order data to provide actionable insights.

Product Data:
{{{productData}}}

Order Data:
{{{orderData}}}

Based on this data, provide the following:
1.  **Business Summary:** A brief, high-level overview of the current business performance. Mention total revenue, number of orders, and any noticeable trends.
2.  **Top Performing Products:** Identify the top 3-5 products. For each, state the product name and a short reason why it's a top performer (e.g., "Highest revenue contribution", "Most units sold").
3.  **Strategic Recommendations:** Provide exactly three concise, actionable recommendations to improve the business. These could be related to inventory management, marketing, pricing, or product bundling.

Your entire response must be in the structured format defined by the output schema.
`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateBusinessInsightsInputSchema,
    outputSchema: GenerateBusinessInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
