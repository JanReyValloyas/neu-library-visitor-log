'use server';
/**
 * @fileOverview A Genkit flow that classifies free-text visit reasons into standard categories
 * or suggests new ones for improved analytics.
 *
 * - classifyVisitReason - A function that handles the visit reason classification process.
 * - ClassifyVisitReasonInput - The input type for the classifyVisitReason function.
 * - ClassifyVisitReasonOutput - The return type for the classifyVisitReason function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyVisitReasonInputSchema = z.object({
  reason: z
    .string()
    .describe("The free-text reason for a library visit, typically from an 'Other' category."),
});
export type ClassifyVisitReasonInput = z.infer<typeof ClassifyVisitReasonInputSchema>;

const standardCategories = [
  'Reading',
  'Researching',
  'Use of Computer',
  'Meeting',
  'Borrowing Books',
  'Other',
] as const;

const ClassifyVisitReasonOutputSchema = z.object({
  classifiedCategory: z
    .enum(standardCategories)
    .describe(
      'The most appropriate standard category for the visit reason, or "Other" if none fit well.'
    ),
  suggestedNewCategory: z
    .string()
    .optional()
    .describe(
      'If classifiedCategory is "Other", this field provides a more specific suggested category (e.g., "Printing Services", "Event Attendance").'
    ),
  explanation: z
    .string()
    .describe('A brief explanation for the chosen classification or suggested new category.'),
});
export type ClassifyVisitReasonOutput = z.infer<typeof ClassifyVisitReasonOutputSchema>;

export async function classifyVisitReason(
  input: ClassifyVisitReasonInput
): Promise<ClassifyVisitReasonOutput> {
  return classifyVisitReasonFlow(input);
}

const classifyVisitReasonPrompt = ai.definePrompt({
  name: 'classifyVisitReasonPrompt',
  input: {schema: ClassifyVisitReasonInputSchema},
  output: {schema: ClassifyVisitReasonOutputSchema},
  prompt: `You are an AI assistant designed to categorize library visit reasons.

Here are the standard categories for library visits: ${standardCategories.join(', ')}

Your task is to classify the user-provided 'Other' reason into one of these standard categories.
If the reason does not fit well into any of the standard categories, classify it as 'Other' and then suggest a more specific new category.

Reason: {{{reason}}}

Provide your response in JSON format according to the output schema.`,
});

const classifyVisitReasonFlow = ai.defineFlow(
  {
    name: 'classifyVisitReasonFlow',
    inputSchema: ClassifyVisitReasonInputSchema,
    outputSchema: ClassifyVisitReasonOutputSchema,
  },
  async input => {
    const {output} = await classifyVisitReasonPrompt(input);
    return output!;
  }
);
