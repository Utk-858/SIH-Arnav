'use server';

/**
 * @fileOverview Generates an initial diet chart based on user profile, vitals, mess menu, and Ayurvedic principles.
 *
 * - generateInitialDietChart - A function that generates the diet chart.
 * - GenerateInitialDietChartInput - The input type for the generateInitialDietChart function.
 * - GenerateInitialDietChartOutput - The return type for the generateInitialDietChart function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialDietChartInputSchema = z.object({
  userProfile: z.string().describe('The user profile including name, age, gender, dietary habits.'),
  vitals: z.string().describe('The patient inputted vitals data.'),
  messMenu: z.string().describe('The mess menu items with nutritional and Ayurvedic properties.'),
  ayurvedicPrinciples: z.string().describe('Ayurvedic principles to consider for the diet chart.'),
});

export type GenerateInitialDietChartInput = z.infer<typeof GenerateInitialDietChartInputSchema>;

const GenerateInitialDietChartOutputSchema = z.object({
  dietChart: z.string().describe('The generated personalized diet chart.'),
});

export type GenerateInitialDietChartOutput = z.infer<typeof GenerateInitialDietChartOutputSchema>;

export async function generateInitialDietChart(input: GenerateInitialDietChartInput): Promise<GenerateInitialDietChartOutput> {
  return generateInitialDietChartFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialDietChartPrompt',
  input: {schema: GenerateInitialDietChartInputSchema},
  output: {schema: GenerateInitialDietChartOutputSchema},
  prompt: `You are an expert Ayurvedic dietician. Generate a personalized diet chart based on the following information:

User Profile: {{{userProfile}}}
Vitals: {{{vitals}}}
Mess Menu: {{{messMenu}}}
Ayurvedic Principles: {{{ayurvedicPrinciples}}}

Consider nutritional balance, Ayurvedic guidelines, and food availability. Suggest meal timings, portion sizes, and alternative foods.
`,
});

const generateInitialDietChartFlow = ai.defineFlow(
  {
    name: 'generateInitialDietChartFlow',
    inputSchema: GenerateInitialDietChartInputSchema,
    outputSchema: GenerateInitialDietChartOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
