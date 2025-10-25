
'use server';

/**
 * @fileOverview Sends a boss spawn report to a Discord webhook.
 * 
 * - sendBossReport - A function that sends a formatted embed to Discord.
 * - BossReportInput - The input type for the sendBossReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BossInfoSchema = z.object({
  name: z.string(),
  level: z.number(),
  spawnTime: z.string(),
});

const BossReportInputSchema = z.object({
  bosses: z.array(BossInfoSchema).describe('A list of bosses with their spawn times.'),
  webhookUrl: z.string().describe('The Discord webhook URL to send the report to.'),
});
export type BossReportInput = z.infer<typeof BossReportInputSchema>;

export async function sendBossReport(input: BossReportInput): Promise<void> {
  return sendBossReportFlow(input);
}

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendBossReportFlow = ai.defineFlow(
  {
    name: 'sendBossReportFlow',
    inputSchema: BossReportInputSchema,
    outputSchema: z.void(),
  },
  async ({ bosses, webhookUrl }) => {

    if (bosses.length === 0) return;

    // Discord allows up to 10 embeds per message. Chunk the bosses to fit.
    const chunkedBosses = [];
    for (let i = 0; i < bosses.length; i += 10) {
        chunkedBosses.push(bosses.slice(i, i + 10));
    }

    // Create an embed for each chunk of bosses.
    const messagePayloads = chunkedBosses.map((chunk, index) => {
        const embed = {
          // Main title and description only on the first embed.
          title: index === 0 ? `⚔️ Boss Spawn Report ⚔️` : undefined,
          description: index === 0 ? `Here is the latest schedule for upcoming world bosses.` : undefined,
          color: 5814783, // A nice blue color
          fields: [
            { name: 'Boss Name', value: chunk.map(b => b.name).join('\n'), inline: true },
            { name: 'Level', value: chunk.map(b => `Lvl ${b.level}`).join('\n'), inline: true },
            { name: 'Next Spawn', value: chunk.map(b => b.spawnTime).join('\n'), inline: true },
          ],
          // Footer and timestamp only on the last embed.
          footer: index === chunkedBosses.length - 1 ? { text: 'L9 Tools' } : undefined,
          timestamp: index === chunkedBosses.length - 1 ? new Date().toISOString() : undefined,
        };
        return { embeds: [embed] }; // Each payload will have one embed object with multiple fields
    });

    // Send each message payload with a delay to avoid rate limiting
    for (let i = 0; i < messagePayloads.length; i++) {
      try {
          const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messagePayloads[i]),
          });

          if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `Failed to send part ${i+1} of the report to Discord. Status: ${response.status} ${response.statusText}.`;
              if (response.status === 404) {
                errorMessage = "The provided Discord webhook URL is invalid or not found. Please check it and try again.";
              } else if (errorText) {
                errorMessage += ` Response: ${errorText}`;
              }
              console.error(errorMessage);
              throw new Error(errorMessage);
          }
          // Wait for 500ms before sending the next part, but not after the last one.
          if (i < messagePayloads.length - 1) {
            await sleep(500);
          }

      } catch (error: any) {
          const errorMessage = `An unexpected error occurred while sending the Discord report: ${error.message || error.toString()}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
      }
    }
  }
);
