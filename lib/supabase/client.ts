import { createClient } from "@supabase/supabase-js";
import { getSupabaseCredentials, supabase as sharedClient } from "../../src/lib/supabase";

const creds = getSupabaseCredentials();

export const supabase = sharedClient || (creds.isConfigured 
  ? createClient(creds.url, creds.anonKey) 
  : null);

export default supabase;
