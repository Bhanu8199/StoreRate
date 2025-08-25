import { 
  users, stores, ratings, 
  type User, type InsertUser, type UserWithStore,
  type Store, type InsertStore, type StoreWithOwner,
  type Rating, type InsertRating, type RatingWithUser, type StoreWithRatings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, avg, count, desc, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<UserWithStore[]>;
  getUsersWithFilters(search?: string, role?: string): Promise<UserWithStore[]>;
  updateUserPassword(id: string, passwordHash: string): Promise<boolean>;

  // Store methods
  getStore(id: string): Promise<Store | undefined>;
  getStoreByOwnerId(ownerId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, updates: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: string): Promise<boolean>;
  getAllStores(): Promise<StoreWithOwner[]>;
  searchStores(search?: string, address?: string): Promise<StoreWithOwner[]>;
  getStoreWithRatings(id: string): Promise<StoreWithRatings | undefined>;

  // Rating methods
  getRating(userId: string, storeId: string): Promise<Rating | undefined>;
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(userId: string, storeId: string, ratingValue: number): Promise<Rating | undefined>;
  deleteRating(userId: string, storeId: string): Promise<boolean>;
  getRatingsByStore(storeId: string): Promise<RatingWithUser[]>;
  getUserRatings(userId: string): Promise<Rating[]>;

  // Stats methods
  getStats(): Promise<{ totalUsers: number; totalStores: number; totalRatings: number; }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllUsers(): Promise<UserWithStore[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(stores, eq(users.id, stores.ownerId))
      .orderBy(users.createdAt);

    return result.map(row => ({
      ...row.users,
      ownedStore: row.stores || undefined,
    }));
  }

  async getUsersWithFilters(search?: string, role?: string): Promise<UserWithStore[]> {
    let query = db
      .select()
      .from(users)
      .leftJoin(stores, eq(users.id, stores.ownerId));

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.address, `%${search}%`)
        )
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(users.createdAt);

    return result.map(row => ({
      ...row.users,
      ownedStore: row.stores || undefined,
    }));
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Store methods
  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreByOwnerId(ownerId: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, ownerId));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async updateStore(id: string, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const [store] = await db
      .update(stores)
      .set(updates)
      .where(eq(stores.id, id))
      .returning();
    return store || undefined;
  }

  async deleteStore(id: string): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllStores(): Promise<StoreWithOwner[]> {
    const result = await db
      .select({
        store: stores,
        owner: users,
        averageRating: avg(ratings.ratingValue),
        totalRatings: count(ratings.id),
      })
      .from(stores)
      .innerJoin(users, eq(stores.ownerId, users.id))
      .leftJoin(ratings, eq(stores.id, ratings.storeId))
      .groupBy(stores.id, users.id)
      .orderBy(stores.createdAt);

    return result.map(row => ({
      ...row.store,
      owner: row.owner,
      averageRating: row.averageRating ? parseFloat(row.averageRating) : 0,
      totalRatings: row.totalRatings || 0,
    }));
  }

  async searchStores(search?: string, address?: string): Promise<StoreWithOwner[]> {
    let query = db
      .select({
        store: stores,
        owner: users,
        averageRating: avg(ratings.ratingValue),
        totalRatings: count(ratings.id),
      })
      .from(stores)
      .innerJoin(users, eq(stores.ownerId, users.id))
      .leftJoin(ratings, eq(stores.id, ratings.storeId));

    const conditions = [];
    if (search) {
      conditions.push(ilike(stores.name, `%${search}%`));
    }
    if (address) {
      conditions.push(ilike(stores.address, `%${address}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .groupBy(stores.id, users.id)
      .orderBy(stores.createdAt);

    return result.map(row => ({
      ...row.store,
      owner: row.owner,
      averageRating: row.averageRating ? parseFloat(row.averageRating) : 0,
      totalRatings: row.totalRatings || 0,
    }));
  }

  async getStoreWithRatings(id: string): Promise<StoreWithRatings | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    if (!store) return undefined;

    const ratingsData = await db
      .select({
        rating: ratings,
        user: users,
      })
      .from(ratings)
      .innerJoin(users, eq(ratings.userId, users.id))
      .where(eq(ratings.storeId, id))
      .orderBy(desc(ratings.createdAt));

    const storeRatings = ratingsData.map(row => ({
      ...row.rating,
      user: row.user,
    }));

    const averageRating = storeRatings.length > 0 
      ? storeRatings.reduce((sum, r) => sum + r.ratingValue, 0) / storeRatings.length
      : 0;

    return {
      ...store,
      ratings: storeRatings,
      averageRating,
    };
  }

  // Rating methods
  async getRating(userId: string, storeId: string): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.storeId, storeId)));
    return rating || undefined;
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(insertRating)
      .returning();
    return rating;
  }

  async updateRating(userId: string, storeId: string, ratingValue: number): Promise<Rating | undefined> {
    const [rating] = await db
      .update(ratings)
      .set({ ratingValue })
      .where(and(eq(ratings.userId, userId), eq(ratings.storeId, storeId)))
      .returning();
    return rating || undefined;
  }

  async deleteRating(userId: string, storeId: string): Promise<boolean> {
    const result = await db
      .delete(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.storeId, storeId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRatingsByStore(storeId: string): Promise<RatingWithUser[]> {
    const result = await db
      .select({
        rating: ratings,
        user: users,
      })
      .from(ratings)
      .innerJoin(users, eq(ratings.userId, users.id))
      .where(eq(ratings.storeId, storeId))
      .orderBy(desc(ratings.createdAt));

    return result.map(row => ({
      ...row.rating,
      user: row.user,
    }));
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  // Stats methods
  async getStats(): Promise<{ totalUsers: number; totalStores: number; totalRatings: number; }> {
    const [userStats] = await db.select({ count: count() }).from(users);
    const [storeStats] = await db.select({ count: count() }).from(stores);
    const [ratingStats] = await db.select({ count: count() }).from(ratings);

    return {
      totalUsers: userStats.count || 0,
      totalStores: storeStats.count || 0,
      totalRatings: ratingStats.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
