import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core"; // Added primaryKey, boolean

// New categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  isSequential: boolean("is_sequential").notNull().default(false), // New: Indicates if category is part of a sequential flow
  order: integer("order").notNull().default(0), // New: Order of the category within a game
});

// Existing tables
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "set null" }),
  expectedAnswer: text("expected_answer"),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
});

export const directMessages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender: text("sender").notNull(),
  senderName: text("sender_name"), // Made nullable
  message: text("message").notNull(),
  teamId: integer("team_id")
    .references(() => teams.id, { onDelete: "cascade" }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["team", "game"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  accessCode: text("access_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id") // New: Link to the users table
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  currentCategoryId: integer("current_category_id").references(() => categories.id, { onDelete: "set null" }), // New: Player's current active category
  completedCategories: text("completed_categories").default("[]").notNull(), // New: JSON string of completed category IDs
  completedQuestions: text("completed_questions").default("[]").notNull(), // New: JSON string of completed question IDs
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  icon: text("icon"), // New: Player's assigned icon
});

// NextAuth.js tables
export const users = pgTable("users", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role", { enum: ["user", "admin", "judge"] }).default("user").notNull(), // Added judge role
  hashedPassword: text("hashed_password"), // Added hashedPassword column
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const playerAdminMessages = pgTable("player_admin_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(), // Can be admin or player ID (as string)
  recipientId: text("recipient_id").notNull(), // Can be admin ID (as string) or "all_admins"
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  teamId: integer("team_id") // Added teamId
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  answerText: text("answer_text"),
  submission_type: text("submission_type", {
    enum: ["photo", "text", "video"],
  }).notNull(),
  video_url: text("video_url"),
  status: text("status", { enum: ["draft", "pending", "graded"] }).notNull().default("draft"),
  score: integer("score"), // Nullable, set after grading
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  gradedBy: text("graded_by") // User ID of the admin/judge who graded it
    .references(() => users.id, { onDelete: "set null" }),
  gradedAt: timestamp("graded_at", { withTimezone: true }), // Nullable, set after grading
});

export const submissionPhotos = pgTable("submission_photos", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  photo_url: text("photo_url").notNull(),
});
