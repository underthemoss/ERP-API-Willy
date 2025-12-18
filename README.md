# es-erp-api

## AuthZed / SpiceDB

1. Install their cli `zed`: https://authzed.com/docs/spicedb/getting-started/installing-zed
2. zed context set local localhost:50051 somerandomkeyhere --insecure
3. If your get a permission issue with writing to that file, do: `sudo chown -R $(whoami) ~/.zed`
4. Add the staging-erp context:

```
zed ctx set staging-erp erp-staging-bb68b7.us-west-2.chah6aer.aws.authzed.net:443 <token-here>
```

## Local Development (Docker + Node)

### Prereqs

- Node.js 20
- Docker Desktop
- AWS SSO access to ECR (for Kafka Connect image)

### One-time setup

1. Install deps:
   ```bash
   npm install
   ```
2. Create local env files (do not commit):
   - Root `.env` for Docker Compose:
     ```
     SPICEDB_TOKEN=somerandomkeyhere
     ```
   - `env/.env.local` for the API process:
     ```
     LEVEL=dev
     PORT=5001
     ERP_CLIENT_URL=http://localhost:3000

     MONGO_CONNECTION_STRING=mongodb://localhost:27017/erp_local?replicaSet=rs0
     REDIS_HOST=localhost
     REDIS_PORT=6379

     KAFKA_API_URL=localhost:9092
     KAFKA_API_KEY=not_needed
     KAFKA_API_SECRET=not_needed
     KAFKA_SCHEMA_REG_API_URL=http://localhost:8081
     KAFKA_SCHEMA_REG_API_KEY=not_needed
     KAFKA_SCHEMA_REG_API_SECRET=not_needed
     KSQLDB_ENDPOINT=http://localhost:8088
     DISABLE_KAFKA=false

     SPICEDB_ENDPOINT=localhost:50051
     SPICEDB_TOKEN=somerandomkeyhere

     OPENSEARCH_ENDPOINT=http://localhost:9200

     FILE_SERVICE_KEY=dummy
     FILE_SERVICE_SECRET=dummy
     FILE_SERVICE_BUCKET=dummy
     OPENAI_API_KEY=dummy
     ```
   - Port `5001` is used here because `5000` is often taken locally.

### Start the stack

1. Authenticate to AWS SSO and ECR:
   ```bash
   aws sso login --profile equipmentshare
   aws ecr get-login-password --region us-west-2 --profile equipmentshare \
     | docker login --username AWS --password-stdin 696398453447.dkr.ecr.us-west-2.amazonaws.com
   ```
2. Start infra (Mongo, Redis, SpiceDB, Redpanda, OpenSearch, ksqlDB):
   ```bash
   docker compose up -d
   ```
3. Start the API:
   ```bash
   npm run with:local -- ts-node src/index.ts
   ```
4. Verify:
   - Health: `http://localhost:5001/health`
   - GraphQL: `http://localhost:5001/graphql`
   - GraphiQL: `http://localhost:5001/graphiql`

### Auth / Frontend integration

- Keep Auth0 audience/service pointed to staging (do not set it to localhost).
- Only change the API base URL to `http://localhost:5001`.
- If you set a base path like `/es-erp-api`, remove it for local.
