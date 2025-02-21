import { pgTable, text, serial, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  company: text("company"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sops = pgTable("sops", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  steps: text("steps").array().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  zapId: text("zap_id").notNull(),
  status: text("status").notNull(),
  connectedApps: text("connected_apps").array().notNull(),
  sopId: uuid("sop_id").notNull().references(() => sops.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  company: true,
});

export const loginSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSOPSchema = createInsertSchema(sops).pick({
  title: true,
  description: true,
  steps: true,
});

export const insertAutomationSchema = createInsertSchema(automations).pick({
  name: true,
  zapId: true,
  status: true,
  connectedApps: true,
  sopId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SOP = typeof sops.$inferSelect;
export type Automation = typeof automations.$inferSelect;
export type InsertSOP = z.infer<typeof insertSOPSchema>;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type LoginData = z.infer<typeof loginSchema>;