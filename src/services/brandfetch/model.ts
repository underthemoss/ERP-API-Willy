import { type MongoClient, type Db, type Collection } from 'mongodb';

export type BrandDoc = {
  _id: string; // brandId from Brandfetch

  // Store the complete raw API response to preserve all data
  rawApiResponse?: any; // Complete unmodified response from Brandfetch API

  // Common fields we know about (kept for backwards compatibility and easy access)
  domain?: string;
  name?: string;
  description?: string;
  longDescription?: string;
  claimed?: boolean;

  // Store complete arrays without filtering
  logos?: Array<any>; // All logo variations from API
  colors?: Array<any>; // All color information from API
  fonts?: Array<any>; // All font information from API
  images?: Array<any>; // All image information from API
  links?: Array<any>; // All links from API

  // Any additional fields from the API that we haven't strongly typed yet
  [key: string]: any; // Allow for any additional fields from Brandfetch

  // Metadata fields
  fetchedFromApiAt?: Date; // Track when data was fetched from Brandfetch API
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

export type BrandUpsertInput = {
  // Accept the complete raw API response
  rawApiResponse?: any;

  // Also accept any individual fields
  [key: string]: any;
};

export class BrandfetchModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'brandfetch';
  private db: Db;
  private collection: Collection<BrandDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<BrandDoc>(this.collectionName);
  }

  async getBrandById(brandId: string): Promise<BrandDoc | null> {
    return await this.collection.findOne({ _id: brandId });
  }

  async getBrandByDomain(domain: string): Promise<BrandDoc | null> {
    return await this.collection.findOne({ domain });
  }

  async upsertBrand(
    brandId: string,
    brand: BrandUpsertInput,
    userId: string,
    fetchedFromApi: boolean = false,
  ): Promise<void> {
    const now = new Date();

    const existingBrand = await this.getBrandById(brandId);

    // Prepare the document with all fields from the input
    const brandData = {
      ...brand,
      _id: brandId,
      ...(fetchedFromApi ? { fetchedFromApiAt: now } : {}),
      updatedAt: now,
      updatedBy: userId,
    };

    if (existingBrand) {
      // Remove _id from update as it's immutable
      const { _id, ...updateData } = brandData;
      await this.collection.updateOne(
        { _id: brandId },
        {
          $set: updateData,
        },
      );
    } else {
      await this.collection.insertOne({
        ...brandData,
        createdAt: now,
        createdBy: userId,
      });
    }
  }

  async batchGetBrandsByIds(brandIds: string[]): Promise<(BrandDoc | null)[]> {
    const brands = await this.collection
      .find({ _id: { $in: brandIds } })
      .toArray();
    const brandMap = new Map(brands.map((b) => [b._id, b]));
    return brandIds.map((id) => brandMap.get(id) || null);
  }
}

export const createBrandfetchModel = (config: { mongoClient: MongoClient }) => {
  return new BrandfetchModel(config);
};
