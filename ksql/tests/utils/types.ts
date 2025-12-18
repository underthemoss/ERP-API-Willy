export interface KsqlTestConfig {
  ksqldbEndpoint: string;
  kafkaBootstrap: string;
  schemaRegistryUrl: string;
  kafkaRestUrl: string;
  connectEndpoint: string;
}
