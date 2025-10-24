'use server';

/**
 * @fileOverview This file defines a Genkit flow for assisting players in finding items based on specific criteria.
 *
 * - `findItems`: A function that takes a query string and returns a list of items that match the query.
 * - `FindItemsInput`: The input type for the `findItems` function.
 * - `FindItemsOutput`: The output type for the `findItems` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindItemsInputSchema = z.object({
  query: z.string().describe('The query to use to find items.'),
});
export type FindItemsInput = z.infer<typeof FindItemsInputSchema>;

const FindItemsOutputSchema = z.object({
  items: z
    .array(z.string())
    .describe('A list of items that match the query, with name and description.'),
});
export type FindItemsOutput = z.infer<typeof FindItemsOutputSchema>;

export async function findItems(input: FindItemsInput): Promise<FindItemsOutput> {
  return findItemsFlow(input);
}

const findItemsPrompt = ai.definePrompt({
  name: 'findItemsPrompt',
  input: {schema: FindItemsInputSchema},
  output: {schema: FindItemsOutputSchema},
  prompt: `You are an expert MMORPG game master, with perfect recall of all items in the game.

  Based on the following request, find items that match the request.

  Request: {{{query}}}

  Return a list of items that match the request, including the name and description of each item.
  `,
});

const findItemsFlow = ai.defineFlow(
  {
    name: 'findItemsFlow',
    inputSchema: FindItemsInputSchema,
    outputSchema: FindItemsOutputSchema,
  },
  async input => {
    const {output} = await findItemsPrompt(input);
    return output!;
  }
);
