import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Changed to postgresql
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Use DATABASE_URL from environment variables
  },
} satisfies Config;
