
import {config} from 'dotenv';
import {resolve} from 'path';

// Load environment variables. This will automatically find the .env file in local development,
// and use the Vercel-provided environment variables in production.
config();

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
