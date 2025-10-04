'use server';

/**
 * @fileOverview Evaluates a patient's Ayurvedic self-assessment.
 *
 * - evaluatePatientAssessment - A function that evaluates the assessment.
 * - EvaluatePatientAssessmentInput - The input type for the function.
 * - EvaluatePatientAssessmentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluatePatientAssessmentInputSchema = z.object({
  assessmentData: z.string().describe('A JSON string containing the assessment questions and the patient\'s answers.'),
});

export type EvaluatePatientAssessmentInput = z.infer<typeof EvaluatePatientAssessmentInputSchema>;

const EvaluatePatientAssessmentOutputSchema = z.object({
  evaluation: z.string().describe('A detailed Ayurvedic evaluation based on the assessment, including dominant dosha(s) and general wellness advice.'),
});

export type EvaluatePatientAssessmentOutput = z.infer<typeof EvaluatePatientAssessmentOutputSchema>;

export async function evaluatePatientAssessment(input: EvaluatePatientAssessmentInput): Promise<EvaluatePatientAssessmentOutput> {
  return evaluatePatientAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluatePatientAssessmentPrompt',
  input: {schema: EvaluatePatientAssessmentInputSchema},
  output: {schema: EvaluatePatientAssessmentOutputSchema},
  prompt: `You are an expert Ayurvedic practitioner. Evaluate the following self-assessment to determine the patient's dominant dosha(s) (Prakriti).

Assessment Data:
{{{assessmentData}}}

Based on the answers, analyze the Vata, Pitta, and Kapha scores. Determine the primary and secondary doshas.
Provide a summary of the dominant dosha's characteristics.
Offer some general diet and lifestyle recommendations based on their Prakriti.
Structure the output clearly with headings.
`,
});

const evaluatePatientAssessmentFlow = ai.defineFlow(
  {
    name: 'evaluatePatientAssessmentFlow',
    inputSchema: EvaluatePatientAssessmentInputSchema,
    outputSchema: EvaluatePatientAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
