import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core"; // Changed to pg-core

export const users = pgTable("users", { // Changed to pgTable
  id: serial("id").primaryKey(), // Changed to serial
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
});

export const questions = pgTable("questions", { // Changed to pgTable
  id: serial("id").primaryKey(), // Changed to serial
  questionText: text("question_text").notNull(),
  category: text("category"),
  expectedAnswer: text("expected_answer"),
});

export const directMessages = pgTable("direct_messages", { // Changed to pgTable
  id: serial("id").primaryKey(), // Changed to serial
  sender: text("sender").notNull(), // "admin" or user's name
  recipient: text("recipient").notNull(), // "admin" or user's name
  message: text("message").notNull(),
  teamName: text("team_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }) // Changed to timestamp with timezone
    .notNull()
    .$defaultFn(() => new Date()),
});

export const teams = pgTable("teams", { // Changed to pgTable
  id: serial("id").primaryKey(), // Changed to serial
  name: text("name").notNull().unique(),
});
