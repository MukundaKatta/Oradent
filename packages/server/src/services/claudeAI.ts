import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const MODEL = 'claude-sonnet-4-6';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Set it in practice settings or environment variables.');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit = error instanceof Anthropic.RateLimitError;
      const isOverloaded = error instanceof Anthropic.InternalServerError;

      if ((isRateLimit || isOverloaded) && attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn({ attempt, delay }, 'Claude API rate limited, retrying...');
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const anthropic = getClient();

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return textBlock.text;
  });
}

export async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  textPrompt?: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const anthropic = getClient();

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: options?.maxTokens || 4096,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            ...(textPrompt
              ? [{ type: 'text' as const, text: textPrompt }]
              : []),
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude Vision');
    }

    return textBlock.text;
  });
}

export function resetClient(): void {
  client = null;
}
