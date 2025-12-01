import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv'; // Re-introduce dotenv for loading
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' }); // Explicitly load .env.local

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const result = spawnSync('drizzle-kit', ['push'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: databaseUrl }, // Pass DATABASE_URL explicitly
});

if (result.error) {
  console.error('Drizzle Kit Push failed:', result.error);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`Drizzle Kit Push exited with status ${result.status}`);
  process.exit(result.status || 1);
}
