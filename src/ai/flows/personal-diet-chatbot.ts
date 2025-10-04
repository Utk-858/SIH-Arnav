'use server';

/**
 * @fileOverview A personal diet chatbot for patients to ask questions about their care plan.
 *
 * - personalDietChatbot - A function that handles the chatbot interaction.
 * - PersonalDietChatbotInput - The input type for the personalDietChatbot function.
 * - PersonalDietChatbotOutput - The return type for the personalDietChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalDietChatbotInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  carePlanDetails: z.string().describe('Detailed information about the patient\'s care plan, including dietary restrictions, meal timings, and Ayurvedic recommendations.'),
  question: z.string().describe('The patient\'s question about their care plan.'),
});
export type PersonalDietChatbotInput = z.infer<typeof PersonalDietChatbotInputSchema>;

const PersonalDietChatbotOutputSchema = z.object({
  answer: z.string().describe('The chatbot\'s answer to the patient\'s question, based on their care plan details.'),
});
export type PersonalDietChatbotOutput = z.infer<typeof PersonalDietChatbotOutputSchema>;

export async function personalDietChatbot(input: PersonalDietChatbotInput): Promise<PersonalDietChatbotOutput> {
  return personalDietChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalDietChatbotPrompt',
  input: {schema: PersonalDietChatbotInputSchema},
  output: {schema: PersonalDietChatbotOutputSchema},
  prompt: `You are a helpful chatbot assisting patients with questions about their Ayurvedic diet care plan.

  Patient Name: {{{patientName}}}

  Care Plan Details: {{{carePlanDetails}}}

  Based on the provided care plan, answer the following question from the patient:

  Question: {{{question}}}

  Answer:`, 
});

const personalDietChatbotFlow = ai.defineFlow(
  {
    name: 'personalDietChatbotFlow',
    inputSchema: PersonalDietChatbotInputSchema,
    outputSchema: PersonalDietChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
