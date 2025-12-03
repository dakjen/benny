import * as dotenv from 'dotenv'; // Import dotenv

dotenv.config({ path: './.env.local' }); // Explicitly load .env.local

const nextConfig = {
  /* config options here */
  // Removed reactCompiler: true
};

export default nextConfig;
