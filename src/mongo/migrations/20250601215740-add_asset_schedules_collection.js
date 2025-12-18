module.exports = {
  async up(db) {
    const collections = await db
      .listCollections({ name: 'asset_schedules' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('asset_schedules');
    }

    await db.collection('asset_schedules').createIndex({ companyId: 1 });
    await db.collection('asset_schedules').createIndex({ asset_id: 1 });
    await db.collection('asset_schedules').createIndex({ project_id: 1 });
  },

  async down(db) {
    await db
      .collection('asset_schedules')
      .dropIndex('companyId_1')
      .catch(() => {});
    await db
      .collection('asset_schedules')
      .dropIndex('asset_id_1')
      .catch(() => {});
    await db
      .collection('asset_schedules')
      .dropIndex('project_id_1')
      .catch(() => {});
    await db.collection('asset_schedules').drop();
  },
};
