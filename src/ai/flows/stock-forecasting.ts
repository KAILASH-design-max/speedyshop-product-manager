'use server';

/**
 * @fileOverview Analyzes historical stock data to forecast future stock needs for informed restocking decisions.
 *
 * - forecastStock - A function that handles the stock forecasting process.
 * - ForecastStockInput - The input type for the forecastStock function.
 * - ForecastStockOutput - The return type for the forecastStock function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastStockInputSchema = z.object({
  productName: z.string().describe('The name of the product to forecast.'),
  historicalStockData: z.string().describe(
    'Historical stock data as a JSON string, including date and stock level.'
  ),
});
export type ForecastStockInput = z.infer<typeof ForecastStockInputSchema>;

const ForecastStockOutputSchema = z.object({
  forecastedStockNeeds: z.string().describe(
    'Forecasted stock needs, including date and recommended stock level.'
  ),
  analysis: z.string().describe('The analysis of historical stock data.'),
});
export type ForecastStockOutput = z.infer<typeof ForecastStockOutputSchema>;

export async function forecastStock(input: ForecastStockInput): Promise<ForecastStockOutput> {
  return forecastStockFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastStockPrompt',
  input: {schema: ForecastStockInputSchema},
  output: {schema: ForecastStockOutputSchema},
  prompt: `You are an expert inventory analyst. Analyze the historical stock data to forecast future stock needs for the product: {{productName}}.

Historical Stock Data: {{{historicalStockData}}}

Provide a detailed analysis and forecasted stock needs, including date and recommended stock level. Return the analysis and forecasted stock needs as strings.
`,
});

const forecastStockFlow = ai.defineFlow(
  {
    name: 'forecastStockFlow',
    inputSchema: ForecastStockInputSchema,
    outputSchema: ForecastStockOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
