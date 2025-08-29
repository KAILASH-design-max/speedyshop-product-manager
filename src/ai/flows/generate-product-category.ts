'use server';
/**
 * @fileOverview Generates a product category and subcategory using AI.
 *
 * - generateProductCategory - A function that handles the category generation.
 * - GenerateProductCategoryInput - The input type for the function.
 * - GenerateProductCategoryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductCategoryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});
export type GenerateProductCategoryInput = z.infer<typeof GenerateProductCategoryInputSchema>;

const GenerateProductCategoryOutputSchema = z.object({
  category: z.string().describe('The generated product category.'),
  subcategory: z.string().describe('The generated product subcategory.'),
});
export type GenerateProductCategoryOutput = z.infer<typeof GenerateProductCategoryOutputSchema>;

export async function generateProductCategory(
  input: GenerateProductCategoryInput
): Promise<GenerateProductCategoryOutput> {
  return generateCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductCategoryPrompt',
  input: { schema: GenerateProductCategoryInputSchema },
  output: { schema: GenerateProductCategoryOutputSchema },
  prompt: `You are an e-commerce expert. Based on the product name, provide a suitable category and subcategory.

Product Name: {{productName}}

For example, for "Desi Ghee (Pure Cow)", you might suggest:
Category: "Masala, Oil & More"
Subcategory: "Oils & Ghee"

For "Classic T-Shirt", you might suggest:
Category: "Apparel"
Subcategory: "Tops"
`,
});

const generateCategoryFlow = ai.defineFlow(
  {
    name: 'generateCategoryFlow',
    inputSchema: GenerateProductCategoryInputSchema,
    outputSchema: GenerateProductCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
