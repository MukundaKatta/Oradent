import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

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

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const anthropic = getClient();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
  } catch (error) {
    logger.error(error, 'Claude API call failed');
    throw error;
  }
}

export async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  textPrompt?: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const anthropic = getClient();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
  } catch (error) {
    logger.error(error, 'Claude Vision API call failed');
    throw error;
  }
}

export function resetClient(): void {
  client = null;
}
