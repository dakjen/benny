import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey(),
  questionText: text("question_text").notNull(),
  category: text("category"),
  expectedAnswer: text("expected_answer"),
});

export const directMessages = sqliteTable("direct_messages", {
  id: integer("id").primaryKey(),
  sender: text("sender").notNull(), // "admin" or user's name
  recipient: text("recipient").notNull(), // "admin" or user's name
  message: text("message").notNull(),
  teamName: text("team_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
});
