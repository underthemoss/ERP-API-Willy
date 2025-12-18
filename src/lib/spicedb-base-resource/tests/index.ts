import { v1 } from '@authzed/authzed-node';
import { AuthzedClient } from '../../authz/spiceDB-client';
import path from 'path';
import fs from 'fs';

const erpSchemaPath = path.join(__dirname, '../../../../spicedb/schema.zed');
const testSchemaPath = path.join(__dirname, './schema.zed');
const erpSchema = fs.readFileSync(erpSchemaPath, 'utf8');
const testSchema = fs.readFileSync(testSchemaPath, 'utf8');

export const writeSchema = (client: AuthzedClient) => {
  return client.writeSchema(
    v1.WriteSchemaRequest.create({
      schema: `${erpSchema} ${testSchema}`,
    }),
  );
};
