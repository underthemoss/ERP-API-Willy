import { FastifyPluginAsync } from 'fastify';
import mercurius from 'mercurius';
import {
  GraphQLContext,
  createContext,
  type CreateContextConfig,
} from './context';
import { buildNexusSchema } from './schema';

declare module 'mercurius' {
  interface MercuriusContext extends GraphQLContext {}
}

export const gqlPlugin: FastifyPluginAsync<CreateContextConfig> = async (
  fastify,
  opts,
) => {
  const { envConfig } = opts;

  fastify.register(mercurius, {
    schema: buildNexusSchema({ envConfig }),
    graphiql: envConfig.GRAPHIQL_ENABLED,
    context: createContext(opts),
    errorFormatter: (execution, context) => {
      const reply: any = (context as any)?.reply;
      const request: any = reply?.request;
      const body: any = request?.body;
      const opFromQueryParam = request?.query?.op;
      const operationName = body?.operationName || opFromQueryParam;
      const querySnippet =
        typeof body?.query === 'string' ? body.query.slice(0, 800) : undefined;
      const errorMessages =
        execution.errors?.map((e: any) => e.message) ?? undefined;

      if (errorMessages && errorMessages.length > 0) {
        fastify.log.warn(
          {
            operationName,
            url: request?.url,
            errorMessages,
            querySnippet,
          },
          'GraphQL execution/validation errors',
        );
      }

      return {
        statusCode: 200,
        response: execution,
      };
    },
    subscription: {
      onConnect: async (data) => {
        // Extract JWT token from WebSocket connection payload
        const token = data?.payload?.Authorization;
        const contextMap: Record<string, any> = {};
        // Create a mock request object with the JWT token in the Authorization header
        const mockReq = {
          headers: {
            authorization: token,
          },
          setDecorator: (key: string, value: any) => {
            contextMap[key] = value;
          },
          server: fastify,
        } as any;

        const mockRes = {} as any;

        // Use the existing context creator with the mock request
        const contextCreator = createContext(opts);
        if (!contextCreator) {
          throw new Error('Context creator is not available');
        }
        const context = await contextCreator(mockReq, mockRes);

        return { ...context, ...contextMap };
      },
      // Enable WebSocket subscriptions
      // emitter: {
      //   // Use EventEmitter for subscriptions
      //   // This is compatible with graphql-subscriptions PubSub
      // },
    },
  });
};
