import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const portfolioVaults = sqliteTable("portfolio_vaults", {
  id: text("id").primaryKey(),
  accessHash: text("access_hash").notNull(),
  payloadJson: text("payload_json").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const accountPortfolios = sqliteTable("account_portfolios", {
  accountHash: text("account_hash").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
