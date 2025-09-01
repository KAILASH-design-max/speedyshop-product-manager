'use server';
/**
 * @fileOverview Generates a product description using AI.
 *
 * - generateProductDescription - A function that handles the description generation.
 * - GenerateProductDescriptionInput - The input type for the function.
 * - GenerateProductDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  keywords: z.string().optional().describe('Optional keywords to include in the description.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  model: googleAI.model('gemini-2.0-pro'),
  config: {
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
        }
    ]
  },
  prompt: `You are a marketing expert. Write a compelling and informative product description for the following product, following the exact structure of the example.

Product Name: {{productName}}
Category: {{category}}
{{#if keywords}}
Keywords to include: {{keywords}}
{{/if}}

Example Output Structure for "Tomatoes":
"Tomatoes are a versatile and essential ingredient in countless cuisines. Bursting with juicy flavor and vibrant color, they add a touch of freshness to any dish. Whether sliced in a salad, simmered in a sauce, or grilled to perfection, tomatoes are a culinary staple.
Storage Tips: Store tomatoes at room temperature away from direct sunlight until ripe. Once ripe, transfer them to the refrigerator to slow down the ripening process. Avoid storing tomatoes in plastic bags, as this can trap moisture and accelerate spoilage.
Nutrient Value & Benefits: Tomatoes are an excellent source of vitamins A and C, as well as potassium and antioxidants like lycopene. Lycopene is known for its potential to protect against certain cancers and heart disease. They are also low in calories and a good source of fiber.
Storage Temperature (degrees Celsius): 10-15
Source: Local Farms
Health Benefits:
- Rich in antioxidants
- Good source of vitamins A and C
- Supports heart health
- May reduce the risk of certain cancers
- Promotes healthy skin
Shelf life: 5-7 days
Return Policy: The product is non-returnable. You can request a replacement for a damaged, rotten, or incorrect item within 48 hours of receiving it. If you receive an incorrect item, you may request a replacement or return it as long as it is sealed, unopened, unused, and in its original packaging.
Country of origin: India"

Generate a similar, detailed description for the given product. Make sure to include all sections from the example.
`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
