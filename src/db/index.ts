import { drizzle } from "drizzle-orm/node-postgres"; // Changed to node-postgres
import { Pool } from "pg"; // Import Pool from pg
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
