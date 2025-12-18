import { type MongoClient, type Db, type Collection } from 'mongodb';

export type CompanyDoc = {
  _id: string;
  name: string;
  company_id: string;
};

export type CompaniesUpsertInput = Omit<CompanyDoc, '_id'>;

export class CompaniesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'companies';
  private db: Db;
  private collection: Collection<CompanyDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<CompanyDoc>(this.collectionName);
  }

  async upsertCompany(id: string, company: CompaniesUpsertInput) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...company, _id: id } },
      { upsert: true },
    );
  }

  async getCompaniesByIds(ids: string[]): Promise<(CompanyDoc | null)[]> {
    const companies = await this.collection
      .find({ _id: { $in: ids.map(Number) as any } })
      .toArray();
    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));
    return ids.map((id) => companyMap.get(id) || null);
  }
}

export const createCompanyModel = (config: { mongoClient: MongoClient }) => {
  const companyModel = new CompaniesModel(config);
  return companyModel;
};
