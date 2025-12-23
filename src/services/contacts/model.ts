import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

type BaseGeneratedFields = '_id' | 'createdAt' | 'documentType' | 'updatedAt';

type ContactType = 'BUSINESS' | 'PERSON';
export type PersonContactType = 'EMPLOYEE' | 'EXTERNAL';

interface BaseContactDoc<T = ContactType> {
  _id: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  contactType: T;
  notes?: string;
  profilePicture?: string;
  name: string;
  phone?: string;
  resourceMapIds?: string[];
}

export interface BusinessContactDoc extends BaseContactDoc<'BUSINESS'> {
  address?: string;
  taxId?: string;
  website?: string;
  accountsPayableContactId?: string;
  poRefTemplateId?: string; // PO reference number template ID for this business contact
  soRefTemplateId?: string; // SO reference number template ID for this business contact
  invoiceRefTemplateId?: string; // Invoice reference number template ID for this business contact
  brandId?: string; // Optional brand ID for this business contact
  placeId?: string; // Google Places ID for this business location
  latitude?: number; // Latitude coordinate for this business location
  longitude?: number; // Longitude coordinate for this business location
}

export interface PersonContactDoc extends BaseContactDoc<'PERSON'> {
  email: string;
  businessId: string;
  personType?: PersonContactType;
}

export type ContactDoc = BusinessContactDoc | PersonContactDoc;

// DTO's
export type BusinessContact = Omit<BusinessContactDoc, '_id'> & {
  id: string;
};
export type PersonContact = Omit<PersonContactDoc, '_id'> & {
  id: string;
};
export type Contact = BusinessContact | PersonContact;

// input types
export type CreateBusinessContactInput = Omit<
  BusinessContactDoc,
  BaseGeneratedFields | 'contactType'
>;
export type CreatePersonContactInput = Omit<
  PersonContactDoc,
  BaseGeneratedFields | 'contactType'
>;
export type UpdateBusinessContactInput = Partial<
  Omit<
    BusinessContactDoc,
    BaseGeneratedFields | 'contactType' | 'workspaceId' | 'createdBy'
  >
>;
export type UpdatePersonContactInput = Partial<
  Omit<
    PersonContactDoc,
    BaseGeneratedFields | 'contactType' | 'workspaceId' | 'createdBy'
  >
>;
// union of inputs
export type CreateContactInput =
  | CreateBusinessContactInput
  | CreatePersonContactInput;

export type ListContactsQuery = {
  filter: {
    workspaceId: string;
    contactType?: ContactType;
    businessId?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class ContactsModel {
  private client: MongoClient;
  public readonly dbName: string = 'es-erp';
  public readonly collectionName: string = 'contacts';
  private db: Db;
  private collection: Collection<ContactDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<ContactDoc>(this.collectionName);
  }

  mapBusinessContact(contact: BusinessContactDoc): BusinessContact {
    const { _id, ...fields } = contact;
    return {
      ...fields,
      id: contact._id,
    };
  }

  mapPersonContact(contact: PersonContactDoc): PersonContact {
    const { _id, ...fields } = contact;
    return {
      ...fields,
      id: contact._id,
    };
  }

  mapContact(contact: ContactDoc) {
    if (contact.contactType === 'BUSINESS') {
      return this.mapBusinessContact(contact);
    } else if (contact.contactType === 'PERSON') {
      return this.mapPersonContact(contact);
    }
    throw new Error('Invalid contact type');
  }

  async createBusinessContact(
    input: CreateBusinessContactInput,
  ): Promise<BusinessContact> {
    const now = new Date();
    const r = await this.collection.insertOne({
      ...input,
      _id: generateId('BIZ', input.workspaceId),
      createdAt: now,
      updatedAt: now,
      contactType: 'BUSINESS',
    });

    const contact = await this.collection.findOne<BusinessContactDoc>({
      _id: r.insertedId,
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.mapBusinessContact(contact);
  }

  async createPersonContact(
    input: CreatePersonContactInput,
  ): Promise<PersonContact> {
    const now = new Date();
    const r = await this.collection.insertOne({
      ...input,
      _id: generateId('PER', input.workspaceId),
      createdAt: now,
      updatedAt: now,
      contactType: 'PERSON',
    });

    const contact = await this.collection.findOne<PersonContactDoc>({
      _id: r.insertedId,
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.mapPersonContact(contact);
  }

  async updateBusinessContact(
    id: string,
    input: Partial<UpdateBusinessContactInput>,
  ): Promise<BusinessContact> {
    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...input,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' },
    );

    if (result === null) {
      throw new Error('Contact not found');
    }

    return this.mapBusinessContact(result as BusinessContactDoc);
  }

  async updatePersonContact(
    id: string,
    input: Partial<UpdatePersonContactInput>,
  ): Promise<PersonContact> {
    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...input,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' },
    );

    if (result === null) {
      throw new Error('Contact not found');
    }

    return this.mapPersonContact(result as PersonContactDoc);
  }

  // Patch methods for partial updates to top-level fields
  async patchBusinessContact(
    id: string,
    patch: Partial<UpdateBusinessContactInput>,
  ): Promise<BusinessContact> {
    // Alias to updateBusinessContact for patch semantics
    return this.updateBusinessContact(id, patch);
  }

  async patchPersonContact(
    id: string,
    patch: Partial<UpdatePersonContactInput>,
  ): Promise<PersonContact> {
    // Alias to updatePersonContact for patch semantics
    return this.updatePersonContact(id, patch);
  }

  async getContactById(id: string): Promise<Contact | null> {
    const contact = await this.collection.findOne({ _id: id });
    if (!contact) {
      return null;
    }
    return this.mapContact(contact);
  }

  async batchGetContactsById(
    ids: readonly string[],
  ): Promise<Array<Contact | null>> {
    const contacts = await this.collection
      .find({ _id: { $in: ids } })
      .toArray();

    const mappedContacts = new Map(
      contacts.map((contact) => [
        String(contact._id),
        this.mapContact(contact),
      ]),
    );

    return ids.map((id) => mappedContacts.get(id) ?? null);
  }

  async deleteContactById(id: string): Promise<void> {
    const result = await this.collection.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new Error('Contact not found');
    }
  }

  async listContacts(query: ListContactsQuery) {
    const { filter, page } = query;
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    return (await this.collection.find(filter, { limit, skip }).toArray()).map(
      (contact) => this.mapContact(contact),
    );
  }

  async countContacts(query: ListContactsQuery['filter']) {
    return this.collection.countDocuments(query);
  }

  async touchAllContacts(options?: {
    batchSize?: number;
  }): Promise<{ touched: number }> {
    const batchSize = options?.batchSize || 1000;
    let totalTouched = 0;
    const now = new Date();

    // Use cursor to iterate through documents in batches
    const cursor = this.collection.find({}, { projection: { _id: 1 } });

    let batch: string[] = [];

    for await (const doc of cursor) {
      batch.push(doc._id);

      // Process batch when it reaches the specified size
      if (batch.length >= batchSize) {
        const result = await this.collection.updateMany(
          { _id: { $in: batch } },
          {
            $set: {
              _touched: now,
            },
          },
        );

        totalTouched += result.modifiedCount;
        batch = []; // Reset batch
      }
    }

    // Process any remaining documents in the final batch
    if (batch.length > 0) {
      const result = await this.collection.updateMany(
        { _id: { $in: batch } },
        {
          $set: {
            _touched: now,
          },
        },
      );

      totalTouched += result.modifiedCount;
    }

    return { touched: totalTouched };
  }
}

export const createContactsModel = (config: { mongoClient: MongoClient }) => {
  const contactModel = new ContactsModel(config);
  return contactModel;
};
