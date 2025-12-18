import { FastifyReply, FastifyRequest } from 'fastify';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface ChatRequestBody {
  messages: ChatMessage[];
  tools?: Tool[];
  model?: string;
  stream?: boolean;
}

/**
 * Chat completion handler with streaming support
 *
 * When stream=true:
 * - Returns Server-Sent Events (SSE) stream
 * - Each chunk contains delta content
 *
 * When stream=false (default):
 * - Returns complete response as JSON
 */
export function chatHandler(openaiApiKey: string | undefined) {
  return async (
    request: FastifyRequest<{ Body: ChatRequestBody }>,
    reply: FastifyReply,
  ) => {
    // Exit early if no authenticated user
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const { messages, tools, model = 'gpt-5.2', stream = false } = request.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return reply.status(400).send({ error: 'messages array is required' });
    }

    if (!openaiApiKey) {
      request.log.error('OPENAI_API_KEY not configured');
      return reply.status(500).send({ error: 'OpenAI API key not configured' });
    }

    // Log chat request
    request.log.info(
      {
        model,
        messageCount: messages.length,
        stream,
        hasTools: !!tools?.length,
        userId: request.user.id,
      },
      'OpenAI chat request',
    );

    try {
      const openaiRequestBody = {
        model,
        messages,
        tools: tools || undefined,
        tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
        stream,
      };

      const openaiResponse = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(openaiRequestBody),
        },
      );

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        request.log.error(
          { error: errorText, status: openaiResponse.status },
          'OpenAI API error',
        );
        return reply
          .status(openaiResponse.status)
          .send({ error: 'OpenAI API request failed' });
      }

      // Handle streaming response
      if (stream) {
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('Access-Control-Allow-Origin', '*');

        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          return reply
            .status(500)
            .send({ error: 'Failed to read stream from OpenAI' });
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              reply.raw.write('data: [DONE]\n\n');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            reply.raw.write(chunk);
          }
        } catch (streamError) {
          request.log.error(
            { error: streamError },
            'Error streaming OpenAI response',
          );
        } finally {
          reply.raw.end();
        }

        return;
      }

      // Handle non-streaming response
      const data = await openaiResponse.json();
      return reply.send(data);
    } catch (error) {
      request.log.error({ error }, 'Agent chat error');
      return reply.status(500).send({
        error: 'Failed to process chat request',
      });
    }
  };
}
