'use server';
/**
 * @fileOverview Suggests a product name using AI.
 *
 * - suggestProductName - A function that handles the name suggestion.
 * - SuggestProductNameInput - The input type for the function.
 * - SuggestProductNameOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestProductNameInputSchema = z.object({
  category: z.string().describe('The category of the product.'),
  description: z.string().optional().describe('A brief description of the product.'),
});
export type SuggestProductNameInput = z.infer<typeof SuggestProductNameInputSchema>;

const SuggestProductNameOutputSchema = z.object({
  productName: z.string().describe('The suggested product name.'),
});
export type SuggestProductNameOutput = z.infer<typeof SuggestProductNameOutputSchema>;

export async function suggestProductName(
  input: SuggestProductNameInput
): Promise<SuggestProductNameOutput> {
  return suggestNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductNamePrompt',
  input: { schema: SuggestProductNameInputSchema },
  output: { schema: SuggestProductNameOutputSchema },
  prompt: `You are a branding expert. Based on the product category and description, suggest a single, specific, and suitable product name.

Category: {{category}}
{{#if description}}
Description: {{description}}
{{/if}}

For example:
- If the category is "Vegetables & Fruits", a good suggestion would be "Fresh Grapes" or "Organic Apples".
- If the category is "Dairy & Breakfast", a good suggestion would be "Amul Gold Milk" or "Britannia Brown Bread".
- If the category is "Instant & Frozen Food", a good suggestion would be "Maggi 2-Minute Noodles".
- If the category is "Munchies", a good suggestion would be "Lays Classic Salted".

Provide just one name, without any extra text or quotation marks.
`,
});

const suggestNameFlow = ai.defineFlow(
  {
    name: 'suggestNameFlow',
    inputSchema: SuggestProductNameInputSchema,
    outputSchema: SuggestProductNameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
