import { FastifyReply, FastifyRequest } from 'fastify';
import { type StudioConversationsService } from '../../../services/studio_conversations';

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
  workspaceId?: string | null;
  conversationId?: string | null;
  title?: string | null;
  pinnedCatalogPath?: string | null;
  workingSet?: Record<string, unknown> | null;
}

type ConversationPersistenceState = {
  conversationId: string;
  created: boolean;
};

type ResponsesInputItem =
  | { role: 'user' | 'assistant'; content: string }
  | {
      type: 'function_call';
      call_id: string;
      name: string;
      arguments: string;
    }
  | { type: 'function_call_output'; call_id: string; output: string };

const buildResponsesInput = (messages: ChatMessage[]) => {
  const input: ResponsesInputItem[] = [];
  const systemParts: string[] = [];

  for (const message of messages) {
    if (message.role === 'system') {
      if (message.content) systemParts.push(message.content);
      continue;
    }

    if (message.role === 'tool') {
      if (message.tool_call_id) {
        input.push({
          type: 'function_call_output',
          call_id: message.tool_call_id,
          output: message.content ?? '',
        });
      }
      continue;
    }

    if (message.content) {
      input.push({ role: message.role, content: message.content });
    }

    if (message.role === 'assistant' && message.tool_calls?.length) {
      for (const call of message.tool_calls) {
        input.push({
          type: 'function_call',
          call_id: call.id,
          name: call.function.name,
          arguments: call.function.arguments ?? '{}',
        });
      }
    }
  }

  return {
    input,
    instructions: systemParts.length ? systemParts.join('\n\n') : undefined,
  };
};

const findLastMessageByRole = (
  messages: ChatMessage[],
  role: ChatMessage['role'],
) => {
  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const message = messages[idx];
    if (message?.role === role) return message;
  }
  return undefined;
};

const findLastIndex = <T>(
  items: T[],
  predicate: (item: T) => boolean,
): number => {
  for (let idx = items.length - 1; idx >= 0; idx -= 1) {
    if (predicate(items[idx])) return idx;
  }
  return -1;
};

const extractWorkspaceIdFromMessages = (messages: ChatMessage[]) => {
  const systemMessage = messages.find((message) => message.role === 'system');
  const content = systemMessage?.content ?? '';
  if (!content) return undefined;

  const directMatch = content.match(/Current Workspace ID:\s*([A-Za-z0-9-]+)/i);
  if (directMatch?.[1]) return directMatch[1];

  const idMatch = content.match(/\bID:\s*([A-Za-z0-9-]+)\b/i);
  if (idMatch?.[1]) return idMatch[1];

  return undefined;
};

const getToolMessagesToPersist = (messages: ChatMessage[]) => {
  const lastToolCallIndex = findLastIndex(
    messages,
    (message) => message.role === 'assistant' && !!message.tool_calls?.length,
  );
  if (lastToolCallIndex < 0) return [];
  return messages
    .slice(lastToolCallIndex + 1)
    .filter((message) => message.role === 'tool');
};

const buildAssistantMetadata = (message: ChatMessage) =>
  message.tool_calls?.length ? { toolCalls: message.tool_calls } : undefined;

const buildToolMetadata = (message: ChatMessage) =>
  message.tool_call_id ? { toolCallId: message.tool_call_id } : undefined;

type ResponseOutputText = { type?: string; text?: string };
type ResponseOutputItem = {
  type?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: ResponseOutputText[];
};

const parseResponsesOutput = (data: any) => {
  const outputItems: ResponseOutputItem[] = Array.isArray(data?.output)
    ? data.output
    : [];
  const toolCalls = outputItems
    .filter((item: ResponseOutputItem) => item?.type === 'function_call')
    .map((item: ResponseOutputItem) => ({
      id: item.call_id ?? '',
      type: 'function' as const,
      function: {
        name: item.name ?? '',
        arguments: item.arguments ?? '{}',
      },
    }));

  const textParts = outputItems
    .filter((item: ResponseOutputItem) => item?.type === 'message')
    .flatMap((item: ResponseOutputItem) =>
      Array.isArray(item.content) ? item.content : [],
    )
    .filter((part: ResponseOutputText) => part?.type === 'output_text')
    .map((part: ResponseOutputText) => part.text ?? '');

  const message: ChatMessage = {
    role: 'assistant',
    content: textParts.join('') || '',
    tool_calls: toolCalls.length ? toolCalls : undefined,
  };

  return {
    message,
    finish_reason: toolCalls.length ? 'tool_calls' : 'stop',
  };
};

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
export function chatHandler(
  openaiApiKey: string | undefined,
  studioConversationsService?: StudioConversationsService,
) {
  return async (
    request: FastifyRequest<{ Body: ChatRequestBody }>,
    reply: FastifyReply,
  ) => {
    // Exit early if no authenticated user
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const {
      messages,
      tools,
      model = 'gpt-5.2-chat-latest',
      stream = false,
      workspaceId,
      conversationId,
      title,
      pinnedCatalogPath,
      workingSet,
    } = request.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return reply.status(400).send({ error: 'messages array is required' });
    }

    if (!openaiApiKey) {
      request.log.error('OPENAI_API_KEY not configured');
      return reply.status(500).send({ error: 'OpenAI API key not configured' });
    }

    const useResponsesApi = !stream && model.startsWith('gpt-5');

    // Log chat request
    request.log.info(
      {
        model,
        messageCount: messages.length,
        stream,
        useResponsesApi,
        hasTools: !!tools?.length,
        userId: request.user.id,
      },
      'OpenAI chat request',
    );

    let persistenceState: ConversationPersistenceState | null = null;

    const ensureConversation = async () => {
      if (!studioConversationsService) return null;
      let resolvedWorkspaceId =
        workspaceId?.trim() || extractWorkspaceIdFromMessages(messages);

      let resolvedConversationId = conversationId?.trim() || undefined;
      let created = false;

      if (resolvedConversationId) {
        const existing = await studioConversationsService.getConversationById(
          resolvedConversationId,
          request.user,
        );
        if (existing) {
          if (
            resolvedWorkspaceId &&
            existing.workspaceId !== resolvedWorkspaceId
          ) {
            throw new Error('Conversation workspace mismatch');
          }
          resolvedWorkspaceId = existing.workspaceId;
          return { conversationId: existing.id, created };
        }
        resolvedConversationId = undefined;
      }

      if (!resolvedWorkspaceId) {
        request.log.warn(
          'Missing workspaceId for agent chat persistence; skipping save.',
        );
        return null;
      }

      const createdConversation =
        await studioConversationsService.createConversation(
          {
            workspaceId: resolvedWorkspaceId,
            title: title ?? null,
            pinnedCatalogPath: pinnedCatalogPath ?? null,
            workingSet: workingSet ?? null,
          },
          request.user,
        );
      created = true;
      return { conversationId: createdConversation.id, created };
    };

    try {
      try {
        persistenceState = await ensureConversation();

        if (persistenceState) {
          const hasToolMessages = messages.some(
            (message) => message.role === 'tool',
          );
          const lastUserMessage = findLastMessageByRole(messages, 'user');

          if (!hasToolMessages && lastUserMessage?.content?.trim()) {
            await studioConversationsService?.addMessage(
              {
                conversationId: persistenceState.conversationId,
                role: 'user',
                content: lastUserMessage.content,
              },
              request.user,
            );
          }

          const toolMessagesToPersist = getToolMessagesToPersist(messages);
          for (const toolMessage of toolMessagesToPersist) {
            await studioConversationsService?.addMessage(
              {
                conversationId: persistenceState.conversationId,
                role: 'tool',
                content: toolMessage.content ?? '',
                metadata: buildToolMetadata(toolMessage),
              },
              request.user,
            );
          }
        }
      } catch (error) {
        request.log.warn({ err: error }, 'Failed to persist agent chat input');
        persistenceState = null;
      }

      if (useResponsesApi) {
        const { input, instructions } = buildResponsesInput(messages);
        const responseTools = tools?.map((tool) => ({
          type: 'function',
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters ?? { type: 'object' },
        }));

        const responsesRequestBody = {
          model,
          input,
          instructions,
          tools: responseTools,
          tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
        };

        const responsesResponse = await fetch(
          'https://api.openai.com/v1/responses',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(responsesRequestBody),
          },
        );

        if (!responsesResponse.ok) {
          const errorText = await responsesResponse.text();
          request.log.error(
            { error: errorText, status: responsesResponse.status },
            'OpenAI Responses API error',
          );
          return reply
            .status(responsesResponse.status)
            .send({ error: 'OpenAI API request failed' });
        }

        const data = await responsesResponse.json();
        const parsed = parseResponsesOutput(data);
        const responsePayload = {
          id: data?.id ?? `resp-${Date.now()}`,
          object: 'chat.completion',
          model: data?.model ?? model,
          choices: [
            {
              index: 0,
              message: parsed.message,
              finish_reason: parsed.finish_reason,
            },
          ],
          conversationId: persistenceState?.conversationId ?? undefined,
          conversationCreated: persistenceState?.created ?? undefined,
        };

        if (persistenceState) {
          try {
            await studioConversationsService?.addMessage(
              {
                conversationId: persistenceState.conversationId,
                role: 'assistant',
                content: parsed.message.content ?? '',
                metadata: buildAssistantMetadata(parsed.message),
              },
              request.user,
            );
          } catch (error) {
            request.log.warn(
              { err: error },
              'Failed to persist agent chat response',
            );
          }
        }

        return reply.send(responsePayload);
      }

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
      const assistantMessage = data?.choices?.[0]?.message as
        | ChatMessage
        | undefined;

      if (persistenceState && assistantMessage) {
        try {
          await studioConversationsService?.addMessage(
            {
              conversationId: persistenceState.conversationId,
              role: 'assistant',
              content: assistantMessage.content ?? '',
              metadata: buildAssistantMetadata(assistantMessage),
            },
            request.user,
          );
        } catch (error) {
          request.log.warn(
            { err: error },
            'Failed to persist agent chat response',
          );
        }
      }

      return reply.send({
        ...data,
        conversationId: persistenceState?.conversationId ?? undefined,
        conversationCreated: persistenceState?.created ?? undefined,
      });
    } catch (error) {
      request.log.error({ error }, 'Agent chat error');
      return reply.status(500).send({
        error: 'Failed to process chat request',
      });
    }
  };
}
