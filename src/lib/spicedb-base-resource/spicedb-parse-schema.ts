import { GenericContainer, Wait } from 'testcontainers';
import { readFile, writeFile } from 'fs/promises';
import { v1 } from '@authzed/authzed-node';

const main = async () => {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error(
      'Usage: ts-node spicedb-parse-schema.ts <input-schema-path> <output-json-path>',
    );
    console.error(
      'Example: ts-node spicedb-parse-schema.ts ./spicedb/schema.zed ./spicedb/schema.generated.json',
    );
    process.exit(1);
  }

  const [inputSchemaPath, outputJsonPath] = args;
  const spicedbToken = 'test-preshared-key';
  let container;

  try {
    // Read the schema file
    const schemaContent = await readFile(inputSchemaPath, 'utf-8');

    // Start the SpiceDB container
    container = await new GenericContainer('authzed/spicedb:latest')
      .withExposedPorts(50051)
      .withCommand([
        'serve',
        '--grpc-preshared-key',
        spicedbToken,
        '--datastore-engine',
        'memory',
      ])
      .withWaitStrategy(Wait.forLogMessage('grpc server started serving'))
      .start();

    const spicedbPort = container.getMappedPort(50051);
    const spicedbEndpoint = `localhost:${spicedbPort}`;

    // Create the client and write the schema
    const authzed = v1.NewClient(
      spicedbToken,
      spicedbEndpoint,
      v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS,
    ).promises;

    await authzed.writeSchema(
      v1.WriteSchemaRequest.create({
        schema: schemaContent,
      }),
    );
    const result = await authzed.reflectSchema({ optionalFilters: [] });
    delete result.readAt;
    await writeFile(outputJsonPath, JSON.stringify(result, undefined, 2));
    console.log(`✅ SpiceDB schema extracted to ${outputJsonPath}`);
  } catch (error) {
    console.error(
      `❌ Error parsing SpiceDB schema from ${inputSchemaPath}:`,
      error,
    );
    process.exit(1);
  } finally {
    // Clean up: stop the container if it was started
    if (container) {
      await container.stop();
      console.log('🧹 SpiceDB container stopped');
    }
  }
};

// Properly handle the async main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
