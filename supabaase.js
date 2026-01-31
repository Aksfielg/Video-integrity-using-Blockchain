import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClient } from "@supabase/supabase-js";

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set in .env file");
}
if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_KEY is not set in .env file");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default supabase;
