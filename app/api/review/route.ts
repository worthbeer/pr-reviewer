import { NextRequest } from 'next/server';
import { client, buildSystemPrompt, buildUserMessage } from '@/lib/claude';
import type { ReviewRequest } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { diff, model, scopes } = body;

  if (!diff?.trim()) {
    return new Response('Diff is required', { status: 400 });
  }
  if (!model) {
    return new Response('Model is required', { status: 400 });
  }
  if (!scopes?.length) {
    return new Response('At least one scope is required', { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(scopes);
  const userMessage = buildUserMessage(diff);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model,
          max_tokens: 4096,
          system: [
            {
              type: 'text',
              text: systemPrompt,
              // Cache the system prompt — it's stable across requests with the same scopes
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userMessage }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text;
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Review failed';
        controller.enqueue(new TextEncoder().encode(`\n\n**Error:** ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
