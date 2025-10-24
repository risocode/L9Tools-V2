'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting character stats based on current gear and skill build.
 *
 * The flow takes character gear and skill build as input and returns suggested stats to optimize character growth.
 * @module statTrackingSuggestions
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Input schema for the stat tracking suggestions flow.
 */
const StatTrackingInputSchema = z.object({
  gearDescription: z
    .string()
    .describe('Description of the character\'s currently equipped gear.'),
  skillBuildDescription: z
    .string()
    .describe('Description of the character\'s current skill build.'),
});

/**
 * Type representing the input to the stat tracking suggestions flow.
 */
export type StatTrackingInput = z.infer<typeof StatTrackingInputSchema>;

/**
 * Output schema for the stat tracking suggestions flow.
 */
const StatTrackingOutputSchema = z.object({
  suggestedStats: z
    .string()
    .describe(
      'A list of suggested stats to focus on, with reasons based on the gear and skill build.'
    ),
});

/**
 * Type representing the output of the stat tracking suggestions flow.
 */
export type StatTrackingOutput = z.infer<typeof StatTrackingOutputSchema>;

/**
 * Async function to get stat tracking suggestions.
 * @param input - The input for stat tracking, including gear and skill build descriptions.
 * @returns A promise that resolves with the stat tracking suggestions.
 */
export async function getStatTrackingSuggestions(
  input: StatTrackingInput
): Promise<StatTrackingOutput> {
  return statTrackingFlow(input);
}

const statTrackingPrompt = ai.definePrompt({
  name: 'statTrackingPrompt',
  input: {schema: StatTrackingInputSchema},
  output: {schema: StatTrackingOutputSchema},
  prompt: `You are an expert MMORPG game advisor. Analyze the character's current gear and skill build to suggest which character stats are most important to improve.

Character Gear: {{{gearDescription}}}
Character Skill Build: {{{skillBuildDescription}}}

Suggest stats that would best optimize the character's growth, explaining your reasoning.`,
});

const statTrackingFlow = ai.defineFlow(
  {
    name: 'statTrackingFlow',
    inputSchema: StatTrackingInputSchema,
    outputSchema: StatTrackingOutputSchema,
  },
  async input => {
    const {output} = await statTrackingPrompt(input);
    return output!;
  }
);
