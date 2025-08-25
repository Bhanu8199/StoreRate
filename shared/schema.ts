import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 60 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"), // 'admin', 'user', 'store_owner'
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 60 }).notNull(),
  address: text("address").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  ratingValue: integer("rating_value").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ratings: many(ratings),
  ownedStore: one(stores, {
    fields: [users.id],
    references: [stores.ownerId],
  }),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [ratings.storeId],
    references: [stores.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(20, "Name must be at least 20 characters").max(60, "Name must be at most 60 characters"),
  email: z.string().email("Invalid email format"),
  passwordHash: z.string(),
  address: z.string().max(400, "Address must be at most 400 characters"),
  role: z.enum(["admin", "user", "store_owner"]).default("user"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores, {
  name: z.string().min(20, "Store name must be at least 20 characters").max(60, "Store name must be at most 60 characters"),
  address: z.string().max(400, "Address must be at most 400 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings, {
  ratingValue: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
}).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(16, "Password must be at most 16 characters"),
});

// Password validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(16, "Password must be at most 16 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

// Update password schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;

// Extended types with relations
export type UserWithStore = User & {
  ownedStore?: Store;
};

export type StoreWithOwner = Store & {
  owner: User;
  averageRating?: number;
  totalRatings?: number;
};

export type RatingWithUser = Rating & {
  user: User;
};

export type StoreWithRatings = Store & {
  ratings: RatingWithUser[];
  averageRating?: number;
};
