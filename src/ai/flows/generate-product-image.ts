
'use server';
/**
 * @fileOverview Generates a product image using AI.
 *
 * - generateProductImage - A function that handles the image generation.
 * - GenerateProductImageInput - The input type for the function.
 * - GenerateProductImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';


const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

export async function generateProductImage(
  input: GenerateProductImageInput
): Promise<GenerateProductImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async ({ productName, category }) => {
    const { media } = await ai.generate({
      model: googleAI.model('googleai/imagen-4.0-fast-generate-001'),
      prompt: `Generate a high-quality, professional e-commerce product photo of a "${productName}" in the category "${category}". 
      The product should be on a clean, white background. The image should be well-lit and visually appealing for a retail website.`,
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
