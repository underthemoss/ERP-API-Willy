import { v1 } from '@authzed/authzed-node';
import { AuthzedClient } from '../../authz/spiceDB-client';
import path from 'path';
import fs from 'fs';

const schemaPath = path.join(__dirname, '../../../../spicedb/schema.zed');
const erpSchema = fs.readFileSync(schemaPath, 'utf8');

export const writeSchema = (client: AuthzedClient) => {
  return client.writeSchema(
    v1.WriteSchemaRequest.create({
      schema: erpSchema,
    }),
  );
};
