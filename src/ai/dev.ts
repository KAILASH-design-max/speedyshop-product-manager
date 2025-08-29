import { config } from 'dotenv';
config();

import '@/ai/flows/stock-forecasting.ts';
import '@/ai/flows/generate-product-description.ts';
import '@/ai/flows/generate-product-category.ts';
import '@/ai/flows/suggest-product-name.ts';
