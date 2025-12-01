import type { NextConfig } from "next";
import * as dotenv from 'dotenv'; // Import dotenv

dotenv.config({ path: './.env.local' }); // Explicitly load .env.local

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
