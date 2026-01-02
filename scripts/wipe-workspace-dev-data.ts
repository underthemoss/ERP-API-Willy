import { MongoClient, ServerApiVersion } from 'mongodb';
import { getEnvConfig } from '../src/config';

type Args = {
  workspaceId?: string;
  dryRun: boolean;
};

const parseArgs = (argv: string[]): Args => {
  const args: Args = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--workspaceId') {
      args.workspaceId = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--dryRun') {
      args.dryRun = true;
      continue;
    }
  }
  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const envConfig = getEnvConfig();

  const client = new MongoClient(envConfig.MONGO_CONNECTION_STRING, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  await client.connect();

  const db = client.db('es-erp');

  const workspaceIds = args.workspaceId
    ? [args.workspaceId]
    : (
        await db
          .collection<{ _id: string }>('workspaces')
          .find({})
          .project({ _id: 1 })
          .toArray()
      ).map((ws) => ws._id);

  if (!workspaceIds.length) {
    throw new Error('No workspaces found to wipe');
  }

  const collectionsByWorkspaceId = [
    'workspace_tags',
    'workspace_attribute_types',
    'workspace_attribute_values',
    'workspace_units',
    'prices',
    'price_books',
  ] as const;

  const report: any = {
    dryRun: args.dryRun,
    workspaceIds,
    deleted: {} as Record<string, Record<string, number>>,
  };

  for (const workspaceId of workspaceIds) {
    report.deleted[workspaceId] = {};

    for (const collectionName of collectionsByWorkspaceId) {
      const collection = db.collection(collectionName);
      if (args.dryRun) {
        report.deleted[workspaceId][collectionName] = await collection.countDocuments(
          { workspaceId },
        );
        continue;
      }
      const result = await collection.deleteMany({ workspaceId });
      report.deleted[workspaceId][collectionName] = result.deletedCount ?? 0;
    }

    const studioFs = db.collection('studio_fs_nodes');
    const studioFsFilter = {
      workspaceId,
      path: { $regex: '^/catalogs/' },
    };

    if (args.dryRun) {
      report.deleted[workspaceId].studio_fs_nodes = await studioFs.countDocuments(
        studioFsFilter,
      );
    } else {
      const result = await studioFs.deleteMany(studioFsFilter);
      report.deleted[workspaceId].studio_fs_nodes = result.deletedCount ?? 0;
    }
  }

  console.log(JSON.stringify(report, null, 2));

  await client.close();
};

main().catch((error) => {
  console.error('Wipe failed:', error);
  process.exit(1);
});

