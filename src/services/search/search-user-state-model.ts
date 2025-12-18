import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

export interface SearchUserStateFavorite {
  searchDocumentId: string;
  addedAt: Date;
}

export interface SearchUserStateRecent {
  searchDocumentId: string;
  accessedAt: Date;
}

export interface SearchUserStateFields {
  userId: string;
  workspaceId: string;
  favorites: SearchUserStateFavorite[];
  recents: SearchUserStateRecent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchUserState extends SearchUserStateFields {
  _id: string;
}

const MAX_RECENT_SEARCHES = 20;

export class SearchUserStateModel {
  private client: MongoClient;
  public readonly dbName: string = 'es-erp';
  public readonly collectionName: string = 'search_user_state';
  private db: Db;
  private collection: Collection<SearchUserState>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<SearchUserState>(this.collectionName);
  }

  /**
   * Get or create user state for a user in a workspace
   */
  async getUserState(
    userId: string,
    workspaceId: string,
  ): Promise<SearchUserState> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      {
        userId,
        workspaceId,
      },
      {
        $setOnInsert: {
          _id: generateId('SEARCH_USER_STATE', workspaceId),
          userId,
          workspaceId,
          favorites: [],
          recents: [],
          createdAt: now,
          updatedAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    if (!result) {
      throw new Error('Failed to get or create user state');
    }

    return result;
  }

  /**
   * Toggle a search document as favorite
   * If it exists, remove it. If it doesn't exist, add it.
   * When adding to favorites, remove from recents since favorites take precedence
   */
  async toggleFavorite(
    userId: string,
    workspaceId: string,
    searchDocumentId: string,
  ): Promise<SearchUserState> {
    const now = new Date();

    // First, get the current state
    const currentState = await this.getUserState(userId, workspaceId);

    // Check if the document is already favorited
    const isFavorited = currentState.favorites.some(
      (fav) => fav.searchDocumentId === searchDocumentId,
    );

    let result: SearchUserState | null;

    if (isFavorited) {
      // Remove from favorites
      result = await this.collection.findOneAndUpdate(
        {
          userId,
          workspaceId,
        },
        {
          $pull: {
            favorites: { searchDocumentId },
          },
          $set: {
            updatedAt: now,
          },
        },
        {
          returnDocument: 'after',
        },
      );

      // After unfavoriting, add to recents
      if (result) {
        result = await this.addRecent(userId, workspaceId, searchDocumentId);
      }
    } else {
      // Add to favorites and remove from recents (favorites take precedence)
      result = await this.collection.findOneAndUpdate(
        {
          userId,
          workspaceId,
        },
        {
          $push: {
            favorites: {
              searchDocumentId,
              addedAt: now,
            },
          },
          $pull: {
            recents: { searchDocumentId },
          },
          $set: {
            updatedAt: now,
          },
        },
        {
          returnDocument: 'after',
        },
      );
    }

    if (!result) {
      throw new Error('Failed to toggle favorite');
    }

    return result;
  }

  /**
   * Add a search document to recents
   * If it already exists, move it to the top (newest first)
   * Auto-prune to keep only the latest 20 items
   * Skip if document is already in favorites (favorites take precedence)
   */
  async addRecent(
    userId: string,
    workspaceId: string,
    searchDocumentId: string,
  ): Promise<SearchUserState> {
    const now = new Date();

    // Get current state to check if document is in favorites
    const currentState = await this.getUserState(userId, workspaceId);

    // Don't add to recents if it's already in favorites
    const isInFavorites = currentState.favorites.some(
      (fav) => fav.searchDocumentId === searchDocumentId,
    );

    if (isInFavorites) {
      // Return current state without modification
      return currentState;
    }

    // Remove the document if it already exists (to avoid duplicates)
    await this.collection.updateOne(
      {
        userId,
        workspaceId,
      },
      {
        $pull: {
          recents: { searchDocumentId },
        },
      },
    );

    // Add to the beginning of the recents array
    const result = await this.collection.findOneAndUpdate(
      {
        userId,
        workspaceId,
      },
      {
        $push: {
          recents: {
            $each: [
              {
                searchDocumentId,
                accessedAt: now,
              },
            ],
            $position: 0, // Add to beginning
            $slice: MAX_RECENT_SEARCHES, // Keep only the first 20
          },
        },
        $set: {
          updatedAt: now,
        },
        $setOnInsert: {
          _id: generateId('SEARCH_USER_STATE', workspaceId),
          userId,
          workspaceId,
          favorites: [],
          createdAt: now,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );

    if (!result) {
      throw new Error('Failed to add recent search');
    }

    return result;
  }

  /**
   * Remove a search document from recents
   */
  async removeRecent(
    userId: string,
    workspaceId: string,
    searchDocumentId: string,
  ): Promise<SearchUserState> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      {
        userId,
        workspaceId,
      },
      {
        $pull: {
          recents: { searchDocumentId },
        },
        $set: {
          updatedAt: now,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!result) {
      throw new Error('Failed to remove recent search');
    }

    return result;
  }

  /**
   * Clear all recent searches for a user in a workspace
   */
  async clearRecents(
    userId: string,
    workspaceId: string,
  ): Promise<SearchUserState> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      {
        userId,
        workspaceId,
      },
      {
        $set: {
          recents: [],
          updatedAt: now,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!result) {
      throw new Error('Failed to clear recent searches');
    }

    return result;
  }
}

export const createSearchUserStateModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new SearchUserStateModel(config);
};
