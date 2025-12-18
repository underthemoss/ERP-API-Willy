export type GlobalConfig = {
  mongoUri: string;
  kafkaBootstrap: string;
  spicedbEndpoint: string;
  spicedbToken: string;
  redisHost: string;
  redisPort: number;
  serverUrl: string;
  s3Endpoint: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Bucket: string;
  s3Region: string;
  ksqldbEndpoint: string;
  jwtPrivateKey: string;
  jwtPublicKey: string;
  jwtTokenExpiry: string;
};
