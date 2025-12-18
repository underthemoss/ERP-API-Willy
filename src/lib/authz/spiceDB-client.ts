import { v1 } from '@authzed/authzed-node';
import grpc from '@grpc/grpc-js';

export type AuthzedClient = v1.ZedClientInterface['promises'];

const defaultOptions = {
  'grpc.enable_retries': 1,
  'grpc.service_config': JSON.stringify({
    methodConfig: [
      {
        name: [
          {
            service: 'authzed.api.v1.PermissionsService',
          },
        ],
        timeout: '10.0s',
        waitForReady: true,
        retryPolicy: {
          maxAttempts: 3,
          initialBackoff: '1s',
          maxBackoff: '10s',
          backoffMultiplier: 1.5,
          retryableStatusCodes: [
            'UNAVAILABLE',
            'UNKNOWN',
            'CANCELLED',
            'INTERNAL',
            'DEADLINE_EXCEEDED',
          ],
        },
      },
    ],
  }),
};

export const createClient = (config: {
  apiToken: string;
  endpoint: string;
  security: v1.ClientSecurity;
  clientOpts?: Partial<grpc.ClientOptions>;
}): AuthzedClient => {
  const {
    apiToken,
    endpoint,
    security = v1.ClientSecurity.SECURE,
    clientOpts,
  } = config;
  let options = defaultOptions;

  if (clientOpts !== undefined) {
    options = {
      ...defaultOptions,
      ...clientOpts,
    };
  }

  return v1.NewClient(apiToken, endpoint, security, undefined, options)
    .promises;
};
