import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const araaReports = mysqlTable("araa_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  score: int("score").notNull(),
  level: varchar("level", { length: 32 }).notNull(),
  datasetVersion: varchar("datasetVersion", { length: 32 }).notNull(),
  matchedCount: int("matchedCount").notNull().default(0),
  findingCount: int("findingCount").notNull().default(0),
  reportMetadata: text("reportMetadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AraaReport = typeof araaReports.$inferSelect;
export type InsertAraaReport = typeof araaReports.$inferInsert;
