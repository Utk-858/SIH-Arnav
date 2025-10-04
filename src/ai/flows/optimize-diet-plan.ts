'use server';

/**
 * @fileOverview An AI agent that re-optimizes a diet plan based on patient feedback.
 *
 * - optimizeDietPlan - A function that handles the diet plan optimization process.
 * - OptimizeDietPlanInput - The input type for the optimizeDietPlan function.
 * - OptimizeDietPlanOutput - The return type for the optimizeDietPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeDietPlanInputSchema = z.object({
  originalDietPlan: z
    .string()
    .describe('The original diet plan to be optimized.'),
  patientFeedback: z
    .string()
    .describe(
      'The patient feedback on the current diet plan, including adherence, symptoms, and energy levels.'
    ),
  availableFoods: z
    .string()
    .describe('A list of available foods for potential substitutions.'),
  patientProfile: z.string().describe('The patient profile information.'),
});
export type OptimizeDietPlanInput = z.infer<typeof OptimizeDietPlanInputSchema>;

const OptimizeDietPlanOutputSchema = z.object({
  optimizedDietPlan: z
    .string()
    .describe('The optimized diet plan based on patient feedback.'),
  rationale: z
    .string()
    .describe(
      'The rationale behind the changes made to the diet plan based on feedback.'
    ),
});
export type OptimizeDietPlanOutput = z.infer<typeof OptimizeDietPlanOutputSchema>;

export async function optimizeDietPlan(
  input: OptimizeDietPlanInput
): Promise<OptimizeDietPlanOutput> {
  return optimizeDietPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeDietPlanPrompt',
  input: {schema: OptimizeDietPlanInputSchema},
  output: {schema: OptimizeDietPlanOutputSchema},
  prompt: `You are a registered dietician specializing in Ayurvedic nutrition. Based on the patient's feedback, profile, and available foods, optimize the diet plan provided. Explain the rationale behind your changes.

Patient Profile: {{{patientProfile}}}

Original Diet Plan: {{{originalDietPlan}}}

Patient Feedback: {{{patientFeedback}}}

Available Foods: {{{availableFoods}}}

Optimize the diet plan, taking into account the feedback, and provide a rationale for your changes. Return the optimized diet plan and the rationale.

Optimized Diet Plan:

Rationale: `,
});

const optimizeDietPlanFlow = ai.defineFlow(
  {
    name: 'optimizeDietPlanFlow',
    inputSchema: OptimizeDietPlanInputSchema,
    outputSchema: OptimizeDietPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
